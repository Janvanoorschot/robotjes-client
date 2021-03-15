import asyncio
import functools
from inspect import getframeinfo, stack


class LocalRequestor(object):

    def __init__(self, loop):
        self.loop = loop
        self.command_queue = asyncio.Queue()
        self.reply_queue = asyncio.Queue()

    def execute(self, cmd):
        caller = getframeinfo(stack()[2][0])
        lineno = caller.lineno
        cmd.insert(0, lineno)
        # switch to the async environment
        future = asyncio.run_coroutine_threadsafe(self.async_execute(cmd), self.loop)
        return future.result()

    async def async_execute(self, cmd):
        await self.command_queue.put(cmd)
        if len(cmd) > 2:
            reply = await self.reply_queue.get()
        else:
            reply = {'result':[]}
        # somehow, the original requestor returned something like this:
        # [[UUID('056c5f92-1457-4e45-be8e-32d6f2a18685'), 'paintWhite'], ([[True]],)]
        return [["some-uuid", cmd], [[[reply['result']]]], reply['status']]

    def empty(self):
        return self.command_queue.empty()

    async def get(self):
        return await self.command_queue.get()

    async def put(self, reply):
        await self.reply_queue.put(reply)

    async def close(self):
        self.command_queue.task_done()
        self.reply_queue.task_done()
