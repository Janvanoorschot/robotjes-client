import json
import uuid
from robotjes.server import app
import robotjes.server as server
from robotjes.server.model import RegistrationSpec, CommandSpec
from . import localsession


@app.post("/confirm/{uid}")
async def confirm_with_game(uid: str):
    specs = server.status_keeper.confirm_reservation(uid)
    if specs:
        data = {
            "cmd": "register",
            "game_id": specs["game_id"],
            "player_id": specs["player_id"],
            "player_name": specs["player_name"],
            "password": specs["password"]
        }
        server.robotjes_engine.register_with_game(data)
        localsession["game_id"] = specs["game_id"]
        localsession["player_id"] = specs["player_id"]
        return {
            "game_id": specs["game_id"],
            "player_id": specs["player_id"]
        }
    else:
        return {
            "game_id": "",
            "player_id": ""
        }

@app.post("/game/{game_id}/player")
async def register_with_game(game_id: str, specs: RegistrationSpec):
    """Register with a game"""
    player_id = str(uuid.uuid4())
    data = {
        "cmd": "register",
        "game_id": game_id,
        "player_id": player_id,
        "player_name": specs.player_name,
        "password": specs.game_password,
    }
    server.robotjes_engine.register_with_game(data)
    return {"player_id": player_id}


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
    try:
        result = server.status_keeper.get_player_status(game_id, player_id)
        return result
    except Exception as e:
        print(f"error as {e}")


@app.put("/game/{game_id}/player/{player_id}")
async def player_move(game_id: str, player_id: str, specs: CommandSpec):
    """Move within a game"""
    data = {
        "cmd": "move",
        "game_id": game_id,
        "player_id": player_id,
        "move": specs.move,
    }
    server.robotjes_engine.move_in_game(data)


@app.get("/field/gamerecording")
async def game_recording(game_id: str, before_game_time: int):
    """Move within a game"""
    result = server.status_keeper.get_game_recording(game_id, before_game_time)
    return result
