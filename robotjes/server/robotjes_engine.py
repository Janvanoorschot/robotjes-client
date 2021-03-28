from uuid import uuid4
from robotjes.server.model import GameSpec, GameStatus
from robotjes.sim import Mazes
from . import Field, StatusKeeper


class RobotjesEngine(object):

    def __init__(self, status_keeper: StatusKeeper, mazes: Mazes, init_spec: GameSpec):
        self.status_keeper = status_keeper
        self.mazes = mazes
        self.bubble_id = uuid4()
        self.game_name = init_spec.game_name
        self.game_id = uuid4()
        self.game_tick = 0
        self.is_started = False
        self.is_stopped = False
        self.is_success = False
        self.players = {}
        self.field = Field(self, init_spec)
        self.field.created()

    def isRunning(self):
        return False

    def start(self):
        # start the current game
        pass

    def stop(self):
        # stop the currently running game and create a new one in the 'created' (not 'running') state
        pass

    def timer(self, now):
        pass

    ####### Requests from robotjes_client via REST
    def register_with_game(self, data):
        if self.field.registered(data["player_id"], data["player_name"]):
            self.players[data["player_id"]] = data["player_name"]

    ######## Useed by Field

    def start_game(self):
        pass

    def publish(self, type: GameStatus, data: map):
        if type == GameStatus.CREATED:
            request = self._create_request(type, data)
            self.status_keeper.game_status_event(request)
        elif type == GameStatus.STARTED:
            request = self._create_request(type, data)
            self.status_keeper.game_status_event(request)
        elif type == GameStatus.STOPPED:
            request = self._create_request(type, data)
            self.status_keeper.game_status_event(request)
        elif type == GameStatus.GAMETICK:
            request = self._create_request(type, data)
            self.status_keeper.game_status_event(request)
        elif type == GameStatus.DELTAREC:
            request = self._create_request(type, data)
            self.status_keeper.game_status_event(request)
        elif type == GameStatus.IDLE:
            request = self._create_request(type, data)
            self.status_keeper.game_status_event(request)

    def _create_request(self, msg:GameStatus, data):
        players_status = {}
        for player_id, dummy in self.players.items():
            players_status[player_id] = self.field.get_player_status(player_id)
        item = {
            "bubble_id": self.bubble_id,
            "game_id":  self.game_id,
            "game_name":  self.game_name,
            "msg": msg.name,
            "game_status": {
                "game_tick": self.game_tick,
                "isStarted": self.is_started,
                "isStopped": self.is_stopped,
                "isSuccess": self.is_success,
            },
            "players_status": players_status,
            "data": data
        }
        return item

