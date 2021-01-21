from . import RestClient
import asyncio


class CLIUmpire:

    def __init__(self, loop, url, client):
        self.rest_client = RestClient(loop, url)
        self.client = client
        self.game_id = None
        self.game_tick = -1
        self.game_name = None
        self.game_password = None
        self.maze = None
        self.success = False
        self.started = False
        self.stopped = False
        self.lock = asyncio.Lock()
        self.players = {}

    async def stop(self):
        await self.rest_client.delete_game(self.game_id)
        if self.lock and self.lock.locked():
            self.lock.release()

    async def stopall(self):
        lst = await self.rest_client.list_games()
        for game_id, game_name in lst.items():
            await self.rest_client.delete_game(game_id)
            print(f"stopped[{game_name}]")

    async def run_game(self, umpire, name, password, maze):
        """ Validate the params, create the game and wait for the game to finish. """
        await self.lock.acquire()
        self.game_name = name
        self.game_password = password
        self.maze = maze
        list = await self.rest_client.list_games()
        for id, game_name in list.items():
            if name == game_name:
                raise Exception(f"game {game_name}/{id} already running")
        self.game_id = await self.rest_client.create_game(umpire, name, password, maze)
        self.callback("registered", self.game_id, self.game_name)
        if not self.game_id:
            raise Exception(f"create game failed")
        await self.lock.acquire()
        return self.success

    async def timer(self):
        if self.game_id and not self.stopped:
            try:
                status = await self.rest_client.status_game(self.game_id)
                if status:
                    self.callback('game_status', self.game_tick, status)
                    game_tick = status['status']['game_tick']
                    self.set_game_status(game_tick, status['status'])
                    if 'players' in status:
                        self.set_players_status(game_tick, status['players'])
                    self.game_tick = game_tick
                    self.callback('game_tick', self.game_tick)
                    if self.stopped:
                        self.lock.release()
            except Exception as e:
                print("Exception: {e}")

    def set_game_status(self, game_tick, game_status):
        self.game_status = game_status
        if not self.stopped and game_status['isStopped']:
            # normal stop
            self.stopped = True
            self.success = game_status['isSuccess']
            self.callback('stopped', self.success)
            return
        if not self.started and game_status['isStarted']:
            # normal game start
            self.started = True
            self.stopped = False
            self.callback('started')

    def set_players_status(self, game_tick, players_status):
        # check for new players
        self.callback('player_status', game_tick, players_status)
        for player_id in players_status:
            if player_id not in self.players:
                self.players[player_id] = player_id
                self.callback('player_registered', player_id, player_id)
        done_players = []
        for player_id, player in self.players.items():
            if player_id not in players_status:
                done_players.append(player_id)
                self.callback('player_deregistered', player_id, player_id)
        for player_id in done_players:
            del self.players[player_id]

    def callback(self, cmd, *args):
        invert_op = getattr(self.client, cmd, None)
        if callable(invert_op):
            invert_op(*args)
