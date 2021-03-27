import json
import uuid
from robotjes.server import app
import robotjes.server as server
from robotjes.server.model import RegistrationSpec, CommandSpec



@app.post("/game/{game_id}/player")
async def register_with_game(game_id: str, specs: RegistrationSpec):
    """Register with a game"""
    player_id = str(uuid.uuid4())
    request = {
        "cmd": "register",
        "game_id": game_id,
        "player_id": player_id,
        "player_name": specs.player_name,
        "password": specs.game_password
    }


@app.delete("/game/{game_id}/player/{player_id}")
async def deregister_with_game(game_id: str, player_id: str):
    """Deregister from a game"""
    request = {
        "cmd": "deregister",
        "game_id": game_id,
        "player_id": player_id,
    }


@app.put("/game/{game_id}/stop")
async def delete_game(game_id: str):
    """Delete/Stop the game"""
    request = {
        "cmd": "delete",
        "game_id": game_id,
    }


@app.get("/game/{game_id}/map")
async def get_game_map(game_id: str):
    """Get the current game map"""
    pass
    result = server.status_keeper.get_game_map(game_id)
    return result


@app.get("/game/{game_id}/status")
async def get_game_status(game_id: str):
    """Get the current game status"""
    result = server.status_keeper.get_game_status(game_id)
    return result


@app.get("/game/{game_id}/recording/{before_game_time}")
async def get_game_recording(game_id: str, before_game_time: int):
    """Get the current game recording"""
    result = server.status_keeper.get_game_recording(game_id, before_game_time)
    return result


@app.get("/game/{game_id}/player/{player_id}/status")
async def get_player_status(game_id: str, player_id: str):
    """Get the current player status"""
    result = server.status_keeper.get_player_status(game_id, player_id)
    return result


@app.put("/game/{game_id}/player/{player_id}")
async def player_move(game_id: str, player_id: str, specs: CommandSpec):
    """Move within a game"""
    request = {
        "cmd": "move",
        "game_id": game_id,
        "player_id": player_id,
        "move": specs.move
    }
