import asyncio


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
        return self.engine.execute(game_tick, robo_id, cmd)

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
        self.started = False
        self.robo_id = None
        self.game_tick = 0
        self.robo_status = None
        self.register_lock = asyncio.Lock()

    async def start_player(self):
        if self.game_id is None:
            list = await self.rest_client.list_games()
            for id, name in list.items():
                if self.game_name == name:
                    self.game_id = id
                    result = await self.rest_client.register_player(self.player_name, self.game_id, self.password)
                    if not result:
                        raise Exception(f"can not join game {self.game_name}")
                    else:
                        self.player_id = result['player_id']
                    break
            else:
                raise Exception(f"no such game {self.game_name}")
            # now wait for the registration info to come in (during timer)
            await self.register_lock.acquire()
            await self.register_lock.acquire()
            if self.robo_id:
                self.started = True
                return self.robo_id
            else:
                return None
        else:
            return None

    async def stop_player(self):
            await self.rest_client.deregister_player(self.game_id, self.player_id)
            self.started = False

    async def execute(self, game_tick, robo_id, cmd):
        return await self.rest_client.issue_command(self.game_id, self.player_id, cmd)

    async def game_timer(self, cur_tick):
        status = await self.rest_client.status_player(self.game_id, self.player_id)
        if status:
            game_tick = status['game_status']['status']['game_tick']
            self.game_tick = game_tick
            if self.robo_id is None:
                for robo_id, robo_status in status['player_status']['robos'].items():
                    self.robo_id = robo_id
                    self.robo_status = robo_status
                    self.register_lock.release()
            else:
                for robo_id, robo_status in status['player_status']['robos'].items():
                    if robo_id == self.robo_id:
                        self.robo_status = robo_status
        return self.game_tick

    def get_robo_status(self, robo_id):
        if robo_id == self.robo_id:
            return self.robo_status
        else:
            return None

    def started(self):
        return self.started

    def stopped(self):
        return not self.started
