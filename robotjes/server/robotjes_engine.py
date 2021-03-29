from uuid import uuid4
from robotjes.server.model import GameSpec, GameStatus
from robotjes.sim import Mazes
from . import Field, StatusKeeper


class RobotjesEngine(object):

    def __init__(self, status_keeper: StatusKeeper, mazes: Mazes, init_spec: GameSpec):
        self.status_keeper = status_keeper
        self.mazes = mazes
        self.bubble_id = str(uuid4())
        self.game_name = init_spec.game_name
        self.game_id = str(uuid4())
        self.game_tick = 0
        self.is_started = False
        self.is_stopped = False
        self.is_success = False
        self.players = {}
        self.moves = {}
        self.field = Field(self, init_spec)
        self.field.created()
        self.game_state = GameStatus.CREATED
        self.resolution = 10
        self.starttime = None
        self.tick = -1
        self.now = None

    def isRunning(self):
        return self.game_state == GameStatus.STARTED

    ####### Requests from robotjes_viewer via REST
    def start_game(self):
        if self.game_state == GameStatus.CREATED:
            # start the current game, it is already created
            self.field.started()
            self.game_state = GameStatus.STARTED

    def stop_game(self):
        # stop the currently running game and create a new one in the 'created' (not 'running') state
        pass

    ####### Requests from robotjes_client via REST
    def register_with_game(self, data):
        if self.field.registered(data["player_id"], data["player_name"]):
            self.players[data["player_id"]] = data["player_name"]

    def move_in_game(self, data):
        game_id = data.get("game_id")
        player_id = data.get("player_id")
        if game_id == self.game_id and player_id in self.players:
            move = data.get("move", {})
            self.moves[player_id] = move

    ######## Useed by Field
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

    ########## Timer logic
    def timer(self, now):
        self.now = now
        if self.now and self.starttime:
            self.tick = self.tick + 1
        else:
            self.tick = 0
        if self.game_state == GameStatus.CREATED or self.game_state == GameStatus.STARTED:
            self.field.timer(now)
            if self.game_state == GameStatus.STARTED:
                if self.tick % self.resolution == 0:
                    self.game_tick = int(self.tick/self.resolution)
                    # do moves
                    self.field.game_timer(self.game_tick, self.moves)
                    self.moves.clear()
            if self.field.is_stopped():
                self.stop_game()





