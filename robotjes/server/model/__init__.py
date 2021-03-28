from enum import Enum

from .specs import GameSpec, PlayerState, GameState
from .specs import RegistrationSpec, CommandSpec

class GameStatus(Enum):
    IDLE = 'idle'
    CREATED = 'created'
    GAMETICK = 'gametick'
    DELTAREC = 'deltarec'
    STARTED = 'started'
    STOPPED = 'stopped'
