import asyncio
import os
import httpx
import functools


class AsyncRestClient:

    def __init__(self, url, debug=False):
        if debug:
            self.client = httpx.AsyncClient(timeout=None, verify=False, http2=True)
        else:
            self.client = httpx.AsyncClient()
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

    def handle_error_reply(self, reply, msg):
        if reply.status_code > 210:
            if reply.status_code == 500:
                result = reply.json()
                raise Exception(f"{msg}: {result['msg']}")
            else:
                raise Exception(f"{msg}: {reply.reason_phrase}")

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
        reply = await self.client.post(
            url,
            data=data,
            headers=headers,
            follow_redirects=True)
        self.handle_error_reply(reply, "failed to login")
        result = reply.json()
        return result

    async def logout(self):
        reply = await self.client.post(
            self.create_url('logout/ajax'),
            headers=self.set_headers())
        self.handle_error_reply(reply, "failed to logout")
        result = reply.json()
        return result

    async def request_field_uuid(self):
        reply = await self.client.get(
            self.create_url('field/uuid'),
            headers=self.set_headers())
        self.handle_error_reply(reply, "failed to request field uuid")
        result = reply.json()
        return result['uuid']

    async def confirm_field_uuid(self, uuid):
        reply = await self.client.post(
            self.create_url(f"bubble/confirm/{uuid}"),
            headers=self.set_headers())
        self.handle_error_reply(reply, "failed to confirm field uuid")
        result = reply.json()
        return result

    async def list_games(self):
        reply = await self.client.get(
            self.create_url('bubble/games'),
            headers=self.set_headers())
        self.handle_error_reply(reply, "failed to list games")
        result = reply.json()
        return result

    async def timer_tick(self):
        reply = await self.client.get(self.create_url('timertick'))
        self.handle_error_reply(reply, "failed rest call timer_tick")
        result = reply.json()
        return result

    async def create_game(self, umpire, name, password, maze):
        spec = {
            "umpire_id": umpire,
            "game_name": name,
            "game_password": password,
            "maze_id": maze
        }
        reply = await self.client.post(
            self.create_url('games'),
            headers=self.set_headers(),
            json=spec)
        self.handle_error_reply(reply, "failed to create game")
        result = reply.json()
        return result['game_id']

    async def delete_game(self, game_id):
        reply = await self.client.put(
            self.create_url(f"game/{game_id}/stop"),
            headers=self.set_headers())
        self.handle_error_reply(reply, "failed to delete game")
        result = reply.json()
        return True

    async def register_player(self, player_name, game_id, password):
        spec = {
            "player_name": player_name,
            "game_password": password,
        }
        reply = await self.client.post(
            self.create_url(f"game/{game_id}/player"),
            headers=self.set_headers(),
            json=spec)
        self.handle_error_reply(reply, "failed rest call register_player")
        result = reply.json()
        return result


    async def deregister_player(self, game_id, player_id):
        spec = {
        }
        reply = await self.client.delete(
            self.create_url(f"game/{game_id}/player/{player_id}"),
            headers=self.set_headers(),
            json=spec)
        self.handle_error_reply(reply, "failed rest call deregister_player")
        result = reply.json()
        return result

    async def issue_command(self, game_id, player_id, move):
        spec = {
            'move': move
        }
        reply = await self.client.put(
            self.create_url(f"game/{game_id}/player/{player_id}"),
            headers=self.set_headers(),
            json=spec)
        self.handle_error_reply(reply, "failed rest call issue_command")
        result = reply.json()
        return result

    async def map_game(self, game_id):
        reply = await self.client.get(
            self.create_url(f"game/{game_id}/map"),
            headers=self.set_headers())
        self.handle_error_reply(reply, "failed rest call issue_command")
        result = reply.json()
        return result

    async def status_game(self, game_id):
        reply = await self.client.get(
            self.create_url(f"game/{game_id}/status"),
            headers=self.set_headers())
        self.handle_error_reply(reply, "failed rest call status_game")
        result = reply.json()
        return result

    async def recording_game(self, game_id, before_game_time):
        reply = await self.client.get(
            self.create_url(f"game/{game_id}/recording/{before_game_time}"),
            headers=self.set_headers())
        self.handle_error_reply(reply, "failed rest call recording_game")
        result = reply.json()
        return result

    async def status_player(self, game_id, player_id, game_tick):
        reply = await self.client.get(
            self.create_url(f"game/{game_id}/player/{player_id}/status"),
            headers=self.set_headers())
        self.handle_error_reply(reply, "failed rest call status_player")
        result = reply.json()
        return result
