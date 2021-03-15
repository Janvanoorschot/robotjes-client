import asyncio
from robotjes.bot import RoboThread, Robo
import sys

import concurrent

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
        self.robos_longcmd = {}
        self.robo_coroutines = {}
        self.robo_status = {}
        self.game_tick = 0

    async def start_player(self, execute):
        robo_id = await self.handler.start_player()
        self.callback('create_robo', self.game_tick, robo_id)
        if(robo_id):
            requestor = LocalRequestor(self.loop)
            robo = Robo(requestor, id=robo_id)
            client_code = RoboThread(robo, execute)
            self.robo_coroutines[robo_id] = self.loop.run_in_executor(
                self.executor,
                client_code.run)
            self.robos[robo.id] = robo
            return robo
        else:
            raise Exception("Failed to create Robo")

    async def run_game(self):
        await self.timer_lock.acquire()
        while not self.stopped:
            await self.timer_lock.acquire()
            for robo_id, robo in self.robos.items():
                if not robo.requestor.empty():
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
                    elif Robo.is_observation(cmd):
                        if robo.id in self.robo_status:
                            status = self.robo_status[robo.id]
                            boolean = Robo.observation(status, cmd)
                        else:
                            boolean = False
                        reply = {'result': boolean}
                    else:
                        reply = {'result': True}
                    secret_reply = await self.handler.execute(self.game_tick, robo.id, cmd)
                    self.callback('issue_command', self.game_tick, robo.id, cmd, secret_reply)
                    reply['status'] = self.handler.get_robo_status(robo_id)
                    await robo.requestor.put(reply)
        return True

    async def stop(self):
        for robo_id, robo in self.robos.items():
            self.robo_coroutines[robo_id].cancel()
            await robo.requestor.close()
        self.executor.shutdown(wait=False)
        self.stopped = True
        sys.exit("player break")

    async def timer(self):
        if not self.stopped:
            # update all timers
            self.game_tick = await self.handler.game_timer(self.game_tick)
            # collect the status of mice and store it
            for robo_id, robo in self.robos.items():
                self.robo_status[robo_id] = self.handler.get_robo_status(robo_id)
                self.callback('robo_status', self.game_tick, robo.id, self.robo_status[robo_id])
            if self.timer_lock.locked():
                self.timer_lock.release()

    def callback(self, cmd, *args):
        invert_op = getattr(self.client, cmd, None)
        if callable(invert_op):
            invert_op(*args)

