import asyncio
import sys

from robotjes.client import RestClient


class CLIViewer:

    def __init__(self, loop, url, client):
        self.loop = loop
        self.rest_client = RestClient(loop, url)
        self.client = client
        self.game_id = None
        self.tick = None
        self.game_tick = None
        self.before_game_time = 0
        self.lock = asyncio.Lock()

    async def stop(self):
        sys.exit("viewer break")

    async def run_game(self, game_name, password):
        await self.lock.acquire()
        list = await self.rest_client.list_games()
        for id, name in list.items():
            if game_name == name:
                self.game_id = id
                break
        else:
            raise Exception(f"no such game {game_name}")
        self.callback('started', self.game_id, game_name)
        await self.lock.acquire()
        print('done')

    async def timer(self):
        try:
            status = await self.rest_client.recording_game(self.game_id, self.before_game_time)
        except Exception as e:
            print(f"failed to get player status: {e}")
            return
        if status:
            # we received a valid delta-recording, handle it
            for delta in status:
                game_tick = delta['game_tick']
                frames = delta['frames']
                map_status = delta['map_status']
                self.set_frames(game_tick, frames)
                self.set_map_status(game_tick, map_status)
                self.before_game_time = game_tick

    def set_frames(self, game_tick, frames):
        self.callback('frames', game_tick, frames)

    def set_map_status(self, game_tick, map_status):
        self.callback('map_status', game_tick, map_status)
        if False:
            if self.timer_lock.locked():
                self.timer_lock.release()

    def callback(self, cmd, *args):
        invert_op = getattr(self.client, cmd, None)
        if callable(invert_op):
            invert_op(*args)

