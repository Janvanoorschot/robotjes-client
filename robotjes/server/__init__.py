from enum import Enum
from .status_keeper import StatusKeeper
from .robotjes_engine import RobotjesEngine
from .robo_game import RoboGame
from .player import Player
from robotjes.server.model import GameSpec, GameState

# fastapi vars
app = None
async_rpc_client = None
async_topic_listener = None

# Current game and the Status of the current Game
current_game = None
status_keeper = None
robotjes_engine = None


class GameStatus(Enum):
    IDLE = 'idle'
    CREATED = 'created'
    GAMETICK = 'gametick'
    DELTAREC = 'deltarec'
    STARTED = 'started'
    STOPPED = 'stopped'

