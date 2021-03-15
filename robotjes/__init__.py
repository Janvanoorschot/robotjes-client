from .bot.robo import Robo

import asyncio

class Timer:
    def __init__(self, timeout, callback, repeat=False):
        self.timeout = timeout
        self.callback = callback
        self.repeat = repeat
        self.task = asyncio.ensure_future(self.job())

    async def job(self):
        try:
            await asyncio.sleep(self.timeout)
        except asyncio.exceptions.CancelledError:
            return
        await self.callback()
        if self.repeat:
            self.task = asyncio.ensure_future(self.job())

    def cancel(self):
        self.repeat = False
        self.task.cancel()


