import datetime
from fastapi_utils.tasks import repeat_every
import robotjes.server as server
from . import app



@app.on_event("startup")
async def startup_event():
    pass

@app.on_event("startup")
@repeat_every(seconds=2)
async def timer_task():
    now = datetime.datetime.now()
    server.status_keeper.timer(now)

