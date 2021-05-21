from uuid import uuid4
import datetime
from robotjes.server.model import GameSpec, GameStatus
from robotjes.sim import Mazes
from robotjes.server import Field, StatusKeeper


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
        self.lastseen = {}
        self.moves = {}
        self.field = Field(self, init_spec)
        self.field.created()
        self.game_state = GameStatus.CREATED
        self.resolution = 10
        self.inactive_limit = 10
        self.starttime = None
        self.tick = -1
        self.now = datetime.datetime.now()

    ####### Requests from robotjes_viewer via REST
    def start_game(self):
        if self.game_state == GameStatus.CREATED:
            # start the current game, it is already created
            self.field.started()
            self.starttime = self.now
            self.game_state = GameStatus.STARTED

    def stop_game(self):
        # stop the currently running game and create a new one in the 'created' (not 'running') state
        pass

    def isRunning(self):
        return self.game_state == GameStatus.STARTED

    ####### Requests from robotjes_client via REST
    def register_with_game(self, data):
        if self.field.registered(data["player_id"], data["player_name"]):
            self.players[data["player_id"]] = data["player_name"]
            # self.lastseen[data["player_id"]] = self.game_tick

    def deregister_with_game(self, player_id):
        if player_id in self.players:
            self.field.deregistered(player_id)
            del self.players[player_id]
            del self.lastseen[player_id]

    def move_in_game(self, data):
        game_id = data.get("game_id")
        player_id = data.get("player_id")
        if game_id == self.game_id and player_id in self.players:
            self.lastseen[player_id] = self.game_tick
            move = data.get("move", {})
            self.moves[player_id] = move

    ######## Used by Field to publish status updates (stored by status_keeper)

    def publish(self, type: GameStatus, data: map):
        request = self._create_request(type, data)
        self.status_keeper.game_status_event(request)

    def _create_request(self, msg: GameStatus, data):
        players_status = {}
        for player_id, dummy in self.players.items():
            players_status[player_id] = self.field.get_player_status(player_id)
        request = {
            "bubble_id": self.bubble_id,
            "game_id": self.game_id,
            "game_name": self.game_name,
            "msg": msg.name,
            "game_status": {
                "game_tick": self.game_tick,
                "isStarted": self.is_started,
                "isStopped": self.is_stopped,
                "isSuccess": self.is_success,
            },
            "players_status": players_status,
            "data": data,
        }
        return request

    ########## Timer logic
    def timer(self, now):
        self.now = now
        if self.now and self.starttime:
            self.tick = self.tick + 1
        else:
            self.tick = 0
        if (
            self.game_state == GameStatus.CREATED
            or self.game_state == GameStatus.STARTED
        ):
            self.field.timer(self.tick)
            if self.game_state == GameStatus.STARTED:
                if self.tick % self.resolution == 0:
                    self.game_tick = int(self.tick / self.resolution)
                    # do moves
                    self.field.game_timer(self.game_tick, self.moves)
                    self.moves.clear()
                    # check any inactive players
                    inactive_players = []
                    for player_id, last_seen_tick in self.lastseen.items():
                        if self.game_tick - last_seen_tick > self.inactive_limit:
                            inactive_players.append(player_id)
                    for player_id in inactive_players:
                        self.deregister_with_game(player_id)
            if self.field.is_stopped():
                self.stop_game()
