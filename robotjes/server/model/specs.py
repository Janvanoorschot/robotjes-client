from typing import List
from pydantic import BaseModel


class GameSpec(BaseModel):
    umpire_id: str
    game_name: str
    game_password: str
    maze_id: str


class RegistrationSpec(BaseModel):
    player_name: str
    game_password: str


class PlayerState(BaseModel):
    id: str


class GameState(BaseModel):
    id: str
    status: str
    players: List[PlayerState]
    result: bool


class CommandSpec(BaseModel):
    move: list


