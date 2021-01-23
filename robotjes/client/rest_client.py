import os
import requests
import functools

class RestClient:

    def __init__(self, loop, url):
        self.loop = loop
        self.url = url
        self.last_move = {}

    async def list_games(self):
        reply = await self.loop.run_in_executor(None, requests.get, self.create_url('games'))
        if reply.status_code == 200:
            result = reply.json()
            return result
        else:
            raise Exception(f"failed rest call list_games:{reply.reason}")

    async def create_game(self, umpire, name, password, maze):
        spec = {
            "umpire_id": umpire,
            "game_name": name,
            "game_password": password,
            "maze_id": maze
        }
        reply = await self.loop.run_in_executor(
            None, functools.partial(requests.post, self.create_url('games'), json=spec))
        if reply.status_code == 200:
            result = reply.json()
            if result['success']:
                return result['game_id']
            else:
                return None
        else:
            raise Exception(f"failed rest call create_game:{reply.text}")

    async def delete_game(self, game_id):
        reply = await self.loop.run_in_executor(
            None, functools.partial(requests.put, self.create_url(f"game/{game_id}/stop")))
        if reply.status_code == 200:
            result = reply.json()
            return True
        else:
            raise Exception(f"failed rest call delete_game:{reply.text}")

    async def register_player(self, player_name, game_id, password):
        spec = {
            "player_name": player_name,
            "game_password": password,
        }
        reply = await self.loop.run_in_executor(
            None, functools.partial(requests.post, self.create_url(f'game/{game_id}/player'), json=spec))
        if reply.status_code == 200:
            result = reply.json()
            return result
        else:
            raise Exception(f"failed rest call register_player:{reply.text}")

    async def deregister_player(self, game_id, player_id):
        spec = {
        }
        reply = await self.loop.run_in_executor(
            None, functools.partial(requests.delete, self.create_url(f'game/{game_id}/player/{player_id}'), json=spec))
        if reply.status_code == 200:
            result = reply.json()
            return result
        else:
            raise Exception(f"failed rest call deregister_player:{reply.text}")

    async def issue_command(self, game_id, player_id, move):
        query = {
            'move': move
        }
        try:
            reply = await self.loop.run_in_executor(
                None, functools.partial(requests.put, self.create_url(f'game/{game_id}/player/{player_id}'), json=query))
        except Exception as e:
            pass
        if reply.status_code == 200:
            result = reply.json()
            return result
        else:
            raise Exception(f"failed rest call issue_command:{reply.text}")

    async def map_game(self, game_id):
        reply = await self.loop.run_in_executor(None, requests.get, self.create_url(f"game/{game_id}/map"))
        if reply.status_code == 200:
            result = reply.json()
            return result
        else:
            raise Exception(f"failed rest call map_game:{reply.reason}")

    async def status_game(self, game_id):
        reply = await self.loop.run_in_executor(None, requests.get, self.create_url(f"game/{game_id}/status"))
        if reply.status_code == 200:
            result = reply.json()
            return result
        else:
            raise Exception(f"failed rest call status_game:{reply.reason}")

    async def recording_game(self, game_id, before_game_time):
        reply = await self.loop.run_in_executor(None, requests.get, self.create_url(f"game/{game_id}/recording/{before_game_time}"))
        if reply.status_code == 200:
            result = reply.json()
            return result
        else:
            raise Exception(f"failed rest call status_game:{reply.reason}")

    async def status_player(self, game_id, player_id):
        reply = await self.loop.run_in_executor(None, requests.get, self.create_url(f"game/{game_id}/player/{player_id}/status"))
        if reply.status_code == 200:
            result = reply.json()
            return result
        else:
            raise Exception(f"failed rest call status_player:{reply.reason}")

    def create_url(self, part):
        full = os.path.join(self.url, part)
        return full

