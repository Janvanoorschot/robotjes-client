from fastapi_utils.tasks import repeat_every
from fastapi import Request

import robotjes
import robotjes.server as server
from . import app


@app.on_event("startup")
async def startup_event():
    pass


@app.on_event("startup")
@repeat_every(seconds=0.1)
async def fastapi_timer_task():
    if not robotjes.debug_mode:
        server.timer_task()


@app.post("/timertick")
async def timer_tick(request: Request):
    server.timer_task()
