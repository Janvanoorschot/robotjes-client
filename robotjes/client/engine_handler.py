import asyncio
from robotjes.bot import Robo


class LocalEngineHandler:
    def __init__(self, engine):
        self.engine = engine
        self.robos = {}
        self.started = False

    async def start_player(self):
        robo_id = self.engine.create_robo()
        if robo_id:
            self.started = True
            self.robos[robo_id] = robo_id
            return robo_id
        else:
            return None

    async def stop_player(self):
        for robo_id, robo_id in self.robos.items():
            self.engine.destroy_robo(robo_id)
            del self.robos[robo_id]
            if len(self.robos) == 0:
                self.started = False

    async def execute(self, game_tick, robo_id, cmd):
        reply = self.engine.execute(game_tick, robo_id, cmd)
        # The reply from the engine looks like this:
        # [
        #   [7, '002d66f0-ec5c-48e5-bc40-e364f1779f3c', 'forward', 1],
        #   (
        #     [
        #       [True, (7, 11)],
        #       {'pos': (7, 11), 'load': 0, 'dir': 90, 'recording': [[2, 'forward', [1], True]], 'fog_of_war': {'left': [None, None, None, False], 'front': [None, None, None, False], 'right': [None, None, None, False]}}
        #     ],
        #    )
        # ]
        b = reply[1][0][0][0]
        status = reply[1][0][1]
        return [b, status, {'active': True}]

    async def game_timer(self, cur_tick):
        next_tick = cur_tick + 1
        self.engine.game_timer(next_tick)
        return next_tick

    def get_robo_status(self, robo_id):
        return self.engine.get_status(robo_id)

    def started(self):
        return self.started

    def stopped(self):
        return not self.started


class RemoteEngineHandler:
    def __init__(self, rest_client, player_name, game_name, password):
        self.rest_client = rest_client
        self.player_name = player_name
        self.game_name = game_name
        self.password = password
        self.game_id = None
        self.player_id = None
        self.is_started = False
        self.is_stopped = False
        self.robo_id = None
        self.game_tick = 0
        self.robo_status = {}
        self.player_result = {}
        self.register_lock = asyncio.Lock()

    async def start_player(self):
        if self.game_id is None:
            list = await self.rest_client.list_games()
            for id, name in list.items():
                if self.game_name == name:
                    self.game_id = id
                    result = await self.rest_client.register_player(
                        self.player_name, self.game_id, self.password
                    )
                    if not result:
                        raise Exception(f"can not join game {self.game_name}")
                    else:
                        self.player_id = result["player_id"]
                    break
            else:
                raise Exception(f"no such game {self.game_name}")
            # now wait for the registration info to come in (during timer)
            print("1")
            await self.register_lock.acquire()
            print("2")
            await self.register_lock.acquire()
            print("3")
            if self.robo_id:
                self.is_started = True
                self.is_stopped = False
                return self.robo_id
            else:
                return None
        else:
            return None

    async def stop_player(self):
        await self.rest_client.deregister_player(self.game_id, self.player_id)

    async def execute(self, game_tick, robo_id, cmd):
        robo_status = self.robo_status.get(robo_id, None)
        player_result = self.player_result
        if Robo.is_observation(cmd) and robo_status:
            b = Robo.observation(robo_status, cmd)
        else:
            rest_reply = await self.rest_client.issue_command(
                self.game_id, self.player_id, cmd
            )
            b = False
        return [b, robo_status, player_result]

    async def game_timer(self, cur_tick):
        game_tick = cur_tick
        while game_tick == cur_tick:
            status = await self.rest_client.status_player(
                self.game_id, self.player_id, cur_tick
            )
            if status:
                game_tick = status["game_status"]["status"]["game_tick"]
        self.game_tick = game_tick
        if self.robo_id is None:
            # first status. set 'our' bot
            for robo_id, robo_status in status["player_status"]["robos"].items():
                self.robo_id = robo_id
                self.register_lock.release()
        for robo_id, robo_status in status["player_status"]["robos"].items():
            self.robo_status[robo_id] = robo_status
        self.player_result = status["player_result"]
        if (
            self.started
            and not self.is_stopped
            and not status["player_result"]["active"]
        ):
            # we are done
            self.is_stopped = True
            await self.stop_player()
        return self.game_tick

    def get_robo_status(self, robo_id):
        return self.robo_status.get(robo_id, None)

    def started(self):
        return self.is_started

    def stopped(self):
        return self.is_stopped
