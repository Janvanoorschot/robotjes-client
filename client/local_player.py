import asyncio
from robotjes.bot import RoboThread, Robo
import sys

import concurrent

from client import RestClient
from robotjes.local import LocalRequestor


class CLILocalPlayer:

    def __init__(self, engine, loop, client):
        self.engine = engine
        self.loop = loop
        self.client = client

        self.local_requestor = LocalRequestor(self.loop)
        self.timer_lock = asyncio.Lock()
        self.stopped = False

        self.executor = concurrent.futures.ThreadPoolExecutor()
        self.robos = {}
        self.robo_coroutines = {}
        self.robo_status = {}
        self.game_tick = None

    def create_robo(self, execute):
        robo_id = self.engine.create_robo()
        if(robo_id):
            robo = Robo(self.local_requestor, id=robo_id)
            client_code = RoboThread(robo, execute)
            self.robo_coroutines[robo_id] = self.loop.run_in_executor(
                self.executor,
                client_code.run)
            self.robos[robo_id] = robo
            return robo
        else:
            raise Exception("Failed to create Robo")

    async def run_game(self, execute):
        robo_id = self.create_robo(execute)
        await self.timer_lock.acquire()
        while not self.stopped:
            await self.timer_lock.acquire()
            cmd = await self.local_requestor.get()
            print(cmd)
            if len(cmd) < 2 or self.stopped:
                break
            elif Robo.is_observation(cmd):
                if robo_id in self.robo_status:
                    status = self.robo_status[robo_id]
                    boolean = Robo.observation(status, cmd)
                else:
                    boolean = False
                reply = {'result': boolean}
            else:
                reply = {'result': True}
            self.callback('issue_command', self.game_tick, robo_id, cmd)
            await self.local_requestor.put(reply)
        self.robo_coroutines[robo_id].cancel()
        return True

    async def stop(self):
        await self.local_requestor.close()
        self.stopped = True
        self.executor.shutdown(wait=False)
        sys.exit("player break")

    async def timer(self):
        if not self.stopped:
            # collect the status of game/player/mouse and store it
            for robo_id, robo in self.robos.items():
                self.robo_status[robo_id] = self.engine.get_status(robo_id)
            self.game_tick = self.engine.game_time
            if self.timer_lock.locked():
                self.timer_lock.release()


    def callback(self, cmd, *args):
        invert_op = getattr(self.client, cmd, None)
        if callable(invert_op):
            invert_op(*args)

