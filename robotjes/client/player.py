import asyncio
from robotjes.bot import Robo

import concurrent
import concurrent.futures

from robotjes.local import LocalRequestor


class Player:

    def __init__(self, handler, loop, client):
        self.handler = handler
        self.loop = loop
        self.client = client

        self.executor = concurrent.futures.ThreadPoolExecutor()
        self.timer_lock = asyncio.Lock()

        self.stopped = False
        self.robos = {}
        self.requestors = {}
        self.robos_longcmd = {}
        self.robo_coroutines = {}
        self.robo_status = {}
        self.game_tick = 0

    async def run_one_robo(self, script):
        robo_id = await self.handler.start_player()
        self.callback('create_robo', self.game_tick, robo_id)
        if(robo_id):
            self.requestors[robo_id] = LocalRequestor(self.loop)
            robo = Robo(self.requestors[robo_id], id=robo_id)
            self.robos[robo.id] = robo
            # start (in executor/seperate_thread) the user *script* with `robo` as argument.
            await self.loop.run_in_executor(self.executor, script, robo)
            self.callback('done_robo', self.game_tick, robo_id)
            await self.requestors[robo_id].stop()
        else:
            raise Exception("Failed to create Robo")

    async def run_runtime(self):
        # handle the communications for all robo's
        for robo_id, robo in self.robos.items():
            if not robo.requestor.empty() or robo_id in self.robos_longcmd:
                if robo_id in self.robos_longcmd:
                    prevcmd = self.robos_longcmd[robo_id]
                    cmd = list(prevcmd)
                    cmd[3] = 1
                    if prevcmd[3] > 1:
                        prevcmd[3] = prevcmd[3] - 1
                    else:
                        del self.robos_longcmd[robo_id]
                else:
                    cmd = await robo.requestor.get()
                    if cmd[2] in ['forward', 'backward', 'left', 'right'] and cmd[3] > 1:
                        nextcmd = list(cmd)
                        nextcmd[3] = nextcmd[3] - 1
                        cmd[3] = 1
                        self.robos_longcmd[robo_id] = nextcmd
                if len(cmd) < 2 or self.stopped:
                    break
                reply = await self.handler.execute(self.game_tick, robo.id, cmd)
                self.callback('issue_command', self.game_tick, robo.id, cmd, reply)
                if robo_id not in self.robos_longcmd:
                    await robo.requestor.put(reply)
        return True

    async def stop(self):
        await self.handler.stop_player()
        self.stopped = True

    async def timer(self):
        if not self.stopped:
            cur_tick = await self.handler.update_status(self.game_tick)
            if cur_tick > self.game_tick:
                self.game_tick = cur_tick
                # collect the status of mice and store it
                for robo_id, robo in self.robos.items():
                    self.robo_status[robo_id] = self.handler.get_robo_status(robo_id)
                    self.callback('robo_status', self.game_tick, robo.id, self.robo_status[robo_id])
                # handle the communication for the robo's
                await self.run_runtime()
        else:
            print("stopped")

    def callback(self, cmd, *args):
        invert_op = getattr(self.client, cmd, None)
        if callable(invert_op):
            invert_op(*args)

