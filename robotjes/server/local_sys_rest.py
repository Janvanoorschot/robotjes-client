import datetime
from robotjes.server.robotjes_engine import RobotjesEngine
from fastapi_utils.tasks import repeat_every
import robotjes.server as server
from . import app



@app.on_event("startup")
async def startup_event():
    pass

@app.on_event("startup")
@repeat_every(seconds=0.1)
async def timer_task():
    now = datetime.datetime.now()
    server.status_keeper.timer(now)
    server.robotjes_engine.timer(now)

