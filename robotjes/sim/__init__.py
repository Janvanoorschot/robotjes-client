from enum import Enum


class WorldEvent(Enum):
    WORLD_EVT_BEACON_EATEN = 1
    WORLD_EVT_BUMP = 2
    WORLD_EVT_HIT_BOT = 3

from .map import Map
from .engine import Engine
from .success import Success
from .mazes import Mazes


