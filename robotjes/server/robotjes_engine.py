from robotjes.server.model import GameSpec, GameStatus
from robotjes.sim import Mazes
from . import Field, StatusKeeper


class RobotjesEngine(object):

    def __init__(self, status_keeper: StatusKeeper, mazes: Mazes, init_spec: GameSpec):
        self.status_keeper = status_keeper
        self.mazes = mazes
        self.field = Field(self, init_spec)

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

    ######## Useed by Field

    def start_game(self):
        pass

    def publish(self, type: GameStatus, data: map ):
        if type == GameStatus.CREATED:
            pass
        elif type == GameStatus.STARTED:
            pass
        elif type == GameStatus.STOPPED:
            pass
        elif type == GameStatus.GAMETICK:
            pass
        elif type == GameStatus.DELTAREC:
            pass
        elif type == GameStatus.IDLE:
            pass

