from enum import Enum


class FieldEvent(Enum):
    FIELD_EVT_LIMIT_REACHED = 1
    FIELD_EVT_TASK_DONE = 2


from .robo_game import RoboGame
from .player import Player
from .field import Field
from .status_keeper import StatusKeeper
from .robotjes_engine import RobotjesEngine

# fastapi vars
app = None
async_rpc_client = None
async_topic_listener = None

# Current game and the Status of the current Game
current_game = None
status_keeper = None
robotjes_engine = None
mazes = None


