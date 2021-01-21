import asyncio
from robotjes.bot import RoboThread, Robo
import sys

import concurrent

from client import RestClient
from robotjes.local import LocalRequestor


class CLIPlayer:

    def __init__(self, loop, url, client):
        self.loop = loop
        self.executor = concurrent.futures.ThreadPoolExecutor()
        self.rest_client = RestClient(loop, url)
        self.local_requestor = LocalRequestor(self.loop)
        self.client = client
        self.player_id = None
        self.game_id = None
        self.tick = None
        self.game_tick = None
        self.running = False
        self.started = False
        self.stopped = False
        self.success = False
        self.timer_lock = asyncio.Lock()
        self.robo_coroutine = None
        self.players = {}
        self.player_status = None
        self.game_status = None
        self.robo_status = {}
        self.client_code = None
        self.robo = None

    async def stop(self):
        await self.rest_client.deregister_player(self.game_id, self.player_id)
        await self.local_requestor.close()
        self.robo.is_running = False
        self.stopped = True
        self.executor.shutdown(wait=False)
        sys.exit("player break")

    async def run_game(self, player_name, game_name, password, execute):
        """ Validate the params and  join the game. """
        list = await self.rest_client.list_games()
        for id, name in list.items():
            if game_name == name:
                self.game_id = id
                result = await self.rest_client.register_player(player_name, self.game_id, password)
                if not result:
                    raise Exception(f"can not join game {game_name}")
                else:
                    self.player_id = result['player_id']
                    self.callback('registered', self.player_id, player_name)
                break
        else:
            raise Exception(f"no such game {game_name}")

        # start the client code
        self.robo = Robo(self.local_requestor)
        self.client_code = RoboThread(self.robo, execute)
        # enter the command/reply cycle until the local_requestor is stopped
        await self.timer_lock.acquire()
        while not self.stopped:
            await self.timer_lock.acquire()
            cmd = await self.local_requestor.get()
            print(cmd)
            if len(cmd) < 2 or self.stopped:
                break
            elif Robo.is_observation(cmd):
                robo_id = self.robo.id
                if robo_id in self.robo_status:
                    status = self.robo_status[robo_id]
                    boolean = Robo.observation(status, cmd)
                else:
                    boolean = False
                reply = {'result': boolean}
            else:
                reply = {'result': True}
            await self.rest_client.issue_command(self.game_id, self.player_id, cmd)
            self.callback('issue_command', self.game_tick, cmd)
            # await self.timer_lock.acquire()
            await self.local_requestor.put(reply)
        await self.rest_client.deregister_player(self.game_id, self.player_id)
        self.robo_coroutine.cancel()
        return self.success

    async def timer(self):
        if not self.stopped:
            try:
                status = await self.rest_client.status_player(self.game_id, self.player_id)
                if status:
                    self.callback('player_status', self.game_tick, status)
                    game_tick = status['game_status']['status']['game_tick']
                    self.set_game_status(game_tick, status['game_status'])
                    bots = status['player_status']['robos'].keys()
                    self.set_player_status(game_tick, status['player_status'])
                    for robo_id, robo_status in status['player_status']['robos'].items():
                        self.set_robo_status(game_tick, robo_id, robo_status)
            except Exception as e:
                print("Exception: {e}")

    def set_game_status(self, game_tick, game_status):
        self.callback('game_status', game_tick, game_status)
        self.game_status = game_status
        if not self.stopped and game_status['status']['isStopped']:
            # normal stop
            self.stopped = True
            self.success = game_status['status']['isSuccess']
            self.callback('stopped', self.success)
            return
        if not self.started and game_status['status']['isStarted']:
            # normal game start
            self.started = True
            self.stopped = False
            self.callback('started')
        if game_tick != self.game_tick:
            self.game_tick = game_tick
            if self.timer_lock.locked():
                self.timer_lock.release()

    def set_player_status(self, game_tick, player_status):
        # self.callback('player_status', game_tick, player_status)
        pass

    def set_robo_status(self, game_tick, robo_id, robo_status):
        self.callback('robo_status', game_tick, robo_id, robo_status)
        if robo_id not in self.robo_status:
            # first time we see this robo, activate its logic
            self.robo.set_id(robo_id)
            self.robo_coroutine = self.loop.run_in_executor(
               self.executor,
               self.client_code.run)
        self.robo_status[robo_id] = robo_status

    def callback(self, cmd, *args):
        invert_op = getattr(self.client, cmd, None)
        if callable(invert_op):
            invert_op(*args)

