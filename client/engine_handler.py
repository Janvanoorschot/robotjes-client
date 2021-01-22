class LocalEngineHandler:

    def __init__(self, engine):
        self.engine = engine
        self.robos = {}
        self.started = False

    def create_robo(self):
        robo_id = self.engine.create_robo()
        if robo_id:
            self.started = True
            self.robos[robo_id] = robo_id
            return robo_id
        else:
            return None

    def destroy_robo(self, robo_id):
        if robo_id in self.robos:
            del self.robos[robo_id]
            if len(self.robos) == 0:
                self.started = False
        else:
            raise Exception(f"Non-existing robo {robo_id}")

    def execute(self, game_tick, robo_id, cmd):
        return self.engine.execute(game_tick, robo_id, cmd)

    def game_timer(self, cur_tick):
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

    def __init__(self, rest_client, player_name, game_name, password,):
        self.rest_client = rest_client
        self.robos = {}
        self.started = False
        list = await self.rest_client.list_games()
        for id, name in list.items():
            if game_name == name:
                self.game_id = id
                result = await self.rest_client.register_player(player_name, self.game_id, password)
                if not result:
                    raise Exception(f"can not join game {game_name}")
                else:
                    self.player_id = result['player_id']
                break
        else:
            raise Exception(f"no such game {game_name}")

    def create_robo(self):
        robo_id = self.engine.create_robo()
        if robo_id:
            self.started = True
            self.robos[robo_id] = robo_id
            return robo_id
        else:
            return None

    def destroy_robo(self, robo_id):
        if robo_id in self.robos:
            del self.robos[robo_id]
            if len(self.robos) == 0:
                self.started = False
        else:
            raise Exception(f"Non-existing robo {robo_id}")

    def execute(self, game_tick, robo_id, cmd):
        return self.engine.execute(game_tick, robo_id, cmd)

    def game_timer(self, cur_tick):
        next_tick = cur_tick + 1
        self.engine.game_timer(next_tick)
        return next_tick

    def get_robo_status(self, robo_id):
        return self.engine.get_status(robo_id)

    def started(self):
        return self.started

    def stopped(self):
        return not self.started
