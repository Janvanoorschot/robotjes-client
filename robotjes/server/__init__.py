from enum import Enum


class FieldEvent(Enum):
    FIELD_EVT_LIMIT_REACHED = 1
    FIELD_EVT_TASK_DONE = 2


from fastapi import FastAPI
from robotjes.sim import Mazes

from .robo_game import RoboGame
from .player import Player
from .field import Field
from .status_keeper import StatusKeeper
from .robotjes_engine import RobotjesEngine

# Some typed global variables
app :FastAPI = None
status_keeper :StatusKeeper = None
robotjes_engine  :RobotjesEngine = None
mazes :Mazes = None

localsession :dict = {}


