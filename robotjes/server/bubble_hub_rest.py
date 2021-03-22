from starlette.responses import RedirectResponse
import robotjes.server as server
from robotjes.server.model import GameSpec
from . import app


@app.get("/")
async def redirect():
    response = RedirectResponse(url='/index.html')
    return response


@app.post("/games")
async def create_game(specs: GameSpec):
    """ Create a game"""
    pass


@app.get("/games")
async def list_games():
    """List current games"""
    pass


@app.get("/mazes")
async def list_mazes():
    """List current mazes"""
    pass


@app.get("/mazes/{maze_id}")
async def list_maze(maze_id: str):
    """List specific maze"""
    pass
