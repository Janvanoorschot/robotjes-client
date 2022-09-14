import asyncio
import os
import httpx
import functools


class AsyncRestClient:

    def __init__(self, url):
        self.client = httpx.AsyncClient(verify=False, http2=True)
        self.url = url
        self.last_move = {}

    async def close(self):
        await self.client.aclose()

    def create_url(self, part):
        full = os.path.join(self.url, part)
        return full

    def set_headers(self, h={}):
        headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
        return h | headers

    def set_cookies(self, c={}):
        cookies = {
        }
        return c | cookies

    # ##
    # POST https://localhost:8888/login/authenticate
    # Content-Type: application/x-www-form-urlencoded
    # X-Requested-With: XMLHttpRequest
    #
    # username=jan@janvanoorschot.nl&password=Gen42Ius
    #
    # ###
    async def login(self, username, password):
        url = self.create_url('login/authenticate')
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
        }
        data = {
            'username': username,
            'password': password
        }
        reply = await self.client.post(url, data=data, headers=headers, follow_redirects=True)
        if reply.status_code <= 210:
            result = reply.json()
            return result
        else:
            raise Exception(f"failed to login: {reply.reason_phrase}")

    async def logout(self):
        reply = await self.client.post(
            self.create_url('logout/ajax'),
            headers=self.set_headers(),
            cookies=self.set_cookies())
        if reply.status_code <= 210:
            self.session_id = None
            result = reply.json()
            return result
        else:
            raise Exception(f"failed to logout: {reply.reason_phrase}")

    async def request_field_uuid(self):
        reply = await self.client.get(
            self.create_url('field/uuid'),
            headers=self.set_headers(),
            cookies=self.set_cookies())
        if reply.status_code <= 210:
            result = reply.json()
            return result['uuid']
        else:
            raise Exception(f"failed to request field uuid: {reply.reason_phrase}")

    async def list_games(self):
        reply = await self.client.get(
            self.create_url('bubble/games'),
            headers=self.set_headers(),
            cookies=self.set_cookies())
        if reply.status_code <= 210:
            result = reply.json()
            return result
        else:
            raise Exception(f"failed to list games: {reply.reason_phrase}")

    async def timer_tick(self):
        reply = await self.client.get(self.create_url('timertick'))
        if reply.status_code == 200:
            result = reply.json()
            return result
        else:
            raise Exception(f"failed rest call timer_tick: {reply.reason_phrase}")

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

    async def confirm_player(self, uuid):
        reply = await self.loop.run_in_executor(
            None, functools.partial(requests.post, self.create_url(f'confirm/{uuid}')))
        if reply.status_code == 200:
            result = reply.json()
            return result
        else:
            raise Exception(f"failed rest call confirm_player:{reply.text}")

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

    async def status_player(self, game_id, player_id, game_tick):
        reply = await self.loop.run_in_executor(None, requests.get, self.create_url(f"game/{game_id}/player/{player_id}/status"))
        if reply.status_code == 200:
            result = reply.json()
            return result
        else:
            raise Exception(f"failed rest call status_player:{reply.reason}")

