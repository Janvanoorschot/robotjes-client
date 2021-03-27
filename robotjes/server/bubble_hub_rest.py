import os
from pathlib import Path
from robotjes.sim import Map
from starlette.responses import RedirectResponse
import robotjes.server as server
from robotjes.server.model import GameSpec
from . import app
rootdir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), os.pardir))

@app.get("/")
async def redirect():
    response = RedirectResponse(url='/index.html')
    return response


@app.get("/games")
async def list_games():
    """ List current game(s)"""
    lst = server.status_keeper.list_games()
    return lst


@app.get("/challenge/skin")
async def get_skin():
    # walk over the skin directory (the same as SkinService in robomindacademy)
    skinName = 'dessertSkinWeb'
    skindir = Path(rootdir) / 'www' / 'images' / 'skins' / skinName
    pathlist = skindir.rglob('*.png')
    result = {}
    for path in pathlist:
        result[path.stem] = Path("/images") / 'skins' / skinName / path.name
    return result

@app.get("/challenge/map")
async def get_map():
    mapfile = Path(rootdir) / 'www' / 'images'/ 'maps' / 'default.map'
    map = Map.fromfile(mapfile)
    return [
        'robo.server.DefaultResult',
        {
            "results":  {
                "map": map.toMazeMap()
            }
        }
    ]

@app.post("/game/stopped2running")
async def stopped2running():
    if not server.robotjes_engine.isRunning():
        server.robotjes_engine.start()

@app.post("/game/running2stopped")
async def running2stopped():
    if server.robotjes_engine.isRunning():
        server.robotjes_engine.stop()

@app.post("/game/running2paused")
async def running2paused():
    pass

@app.post("/game/paused2running")
async def paused2running():
    pass

