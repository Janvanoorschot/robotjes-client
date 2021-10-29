import os
from uuid import uuid4
from pathlib import Path

from fastapi import Request, Response
from fastapi.templating import Jinja2Templates
from starlette.responses import RedirectResponse
from . import app
from . import localsession

from robotjes.sim import Map
import robotjes.server as server

rootdir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), os.pardir))
templates = Jinja2Templates(directory="templates")

localsession["uuid"] = ""
localsession["player_id"] = ""
localsession["game_id"] = ""

@app.get("/")
async def home_page(request: Request):
    return templates.TemplateResponse("index.html", {"request": request, "uuid": localsession["uuid"]})

@app.get("/submit_page")
async def submit_page(request: Request):
    # request.query_params['jvo_activate'] == 'Go'
    if localsession["uuid"] == "" and 'jvo_activate' in request.query_params and request.query_params['jvo_activate'] == 'Go':
        localsession["uuid"] = str(uuid4())
        request = {}
        request['uuid'] = localsession["uuid"]
        request['game_name'] = "eat_three"
        request['player_name'] = "me"
        request['password'] = "secret"
        server.status_keeper.set_reservation(localsession["uuid"], request)
    elif localsession["uuid"] != "" and 'jvo_activate' in request.query_params and request.query_params['jvo_activate'] == 'Go':
        localsession["uuid"] = ''
    return RedirectResponse("/")


@app.get("/field/status")
async def field_status(request: Request):
    started = False
    done = True
    uuid = localsession["uuid"]
    game_id = localsession["game_id"]
    player_id = localsession["player_id"]
    if game_id != "" and player_id != "":
        player_status = server.status_keeper.get_player_status(localsession["game_id"], localsession["player_id"])
        if len(player_status) > 0 and player_status['player_result']['active']:
            started = True
            done = False
        else:
            started = True
            done = True
            localsession["uuid"]=""
            localsession["game_id"]=""
            localsession["player_id"]=""
    return {
        "uuid": uuid,
        "started": started,
        "done": done,
        "info": {
            "game_id": game_id,
            "player_id": player_id
        }
    }

@app.get("/games")
async def list_games():
    """ List current game(s)"""
    lst = server.status_keeper.list_games()
    return lst

@app.get("/localgame")
async def local_game():
    """ Return the one local game that is automatically """
    games = server.status_keeper.list_games()
    game_id  = list(games.keys())[0]
    game_status = server.status_keeper.get_game_status(game_id)
    player_id = None
    return {"game_id": game_id, "player_id": player_id}

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
        server.robotjes_engine.start_game()

@app.post("/game/running2stopped")
async def running2stopped():
    if server.robotjes_engine.isRunning():
        server.robotjes_engine.stop_game()

@app.post("/game/running2paused")
async def running2paused():
    pass

@app.post("/game/paused2running")
async def paused2running():
    pass

