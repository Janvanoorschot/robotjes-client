from . import RoboGame, Player, FieldEvent
from robotjes.server.model import GameSpec, GameStatus
from robotjes.sim import WorldEvent


class Field:
    """
        A Field where players/robots can check-in/check-out
        at will
    """

    def __init__(self, owner, spec: GameSpec):
        self.owner = owner
        self.game = self.create_game(spec)
        self.game_name = spec.game_name
        self.isStarted = False
        self.isStopped = False
        self.isSuccess = False
        self.tick = 0
        self.game_tick = 0
        self.max_player_count = 10
        self.max_start_tick = 15
        self.max_tick = 30
        self.players = {}
        self.resolution = 5

    def event(self, evt: FieldEvent, player_id: str, data: dict):
        # handler world even and turn it into owner-publish
        if evt == FieldEvent.FIELD_EVT_TASK_DONE:
            self.owner.publish(GameStatus.PLAYER_SUCCESS, {
                "player_id": player_id
            })
        elif evt == FieldEvent.FIELD_EVT_LIMIT_REACHED:
            self.owner.publish(GameStatus.PLAYER_FAILURE, {
                "player_id": player_id
            })
        else:
            pass

    def create_game(self, spec: GameSpec):
        if spec.game_name == 'eat_three':
            counters = {
                "min": {
                    WorldEvent.WORLD_EVT_BEACON_EATEN: 3
                },
                "max": {
                    WorldEvent.WORLD_EVT_BUMP: 1,
                    WorldEvent.WORLD_EVT_TIMER: 15
                }
            }
        elif spec.game_name == 'hit_three':
            counters = {
                "min": {
                    WorldEvent.WORLD_EVT_HIT_BOT: 3
                },
                "max": {
                    WorldEvent.WORLD_EVT_BUMP: 1,
                    WorldEvent.WORLD_EVT_TIMER: 60
                }
            }
        else:
            raise ValueError(f"invalid game name: {spec.game_name}")
        mapstr = self.owner.mazes.get_map(spec.maze_id)
        game = RoboGame(mapstr, counters)
        game.add_listener(self.event)
        return game

    def created(self):
        # send a status change to the games exchange
        self.owner.publish(GameStatus.CREATED, {
            "maze_map": self.game.maze_map()
        })
        # we start the game immediatly after it is created
        self.owner.start_game()

    def started(self):
        self.game_tick = 0
        self.isStarted = True
        self.isStopped = False
        self.isSuccess = True
        self.owner.publish(GameStatus.STARTED, {})

    def stopped(self):
        self.owner.publish(GameStatus.STOPPED, {})

    def registered(self, player_id, player_name):
        player = Player(player_id, player_name)
        self.game.registered(player_id)
        self.owner.publish(GameStatus.PLAYER_REGISTER, {
            "player_id": player_id,
            "player_name": player_name
        })
        robo_id = self.game.create_robo(player.player_id)
        if robo_id:
            player.robos.append(robo_id)
            self.players[player_id] = player
            return True
        else:
            return False

    def deregistered(self, player_id):
        if player_id in self.players:
            player = self.players[player_id]
            self.owner.publish(GameStatus.PLAYER_DEREGISTER, {
                "player_id": player_id
            })
            for robo_id in player.robos:
                self.game.destroy_robo(robo_id)
            self.game.deregistered(player_id)
            del self.players[player_id]

    def is_stopped(self):
        return self.isStopped

    def result(self):
        return self.isSuccess

    def player_count(self):
        return self.max_player_count

    def owned_by(self, robo_id):
        for player_id, player in self.players.items():
            for robo in player.robos:
                if robo_id == robo:
                    return player_id
        return None

    def get_game_status(self):
        return {
            "game_tick": self.game_tick,
            "isStarted": self.isStarted,
            "isStopped": self.isStopped,
            "isSuccess": self.isSuccess
        }

    def get_player_status(self, player_id):
        if player_id in self.players:
            player = self.players[player_id]
            status = player.get_status(self.game)
            if self.game:
                status['counters'] = self.game.get_player_counters(player_id)
            else:
                status['counters'] = {}
            return status
        else:
            return {}

    def get_map_status(self):
        return self.game.get_map_status()

    def timer(self, tick):
        self.tick = tick

    def game_timer(self, tick, moves):
        self.game_tick = self.game_tick + 1
        self.game.start_moves(self.game_tick)
        for player_id, move in moves.items():
            line_no = move[0]
            robo_id = move[1]
            self.game.execute(self.game_tick, robo_id, move)
        self.game.end_moves(self.game_tick)
        # publish info: GAMETICK AND/OR DELTAREC
        self.owner.publish(GameStatus.GAMETICK, {})
        if self.game_tick % self.resolution == 0:
            drec = self.game.recording_delta()
            self.owner.publish(GameStatus.DELTAREC, drec)
