import datetime
import logging
import uuid
import robotjes

logger = logging.getLogger(__name__)


class StatusKeeper(object):
    def __init__(self):
        self.reservations: dict(str, map) = {}
        self.done_reservations: dict(str, str) = {}
        self.player2reservation: dict(str, str) = {}
        self.games: dict(str, GameStatus) = {}
        self.lastseen = {}
        self.now = None
        self.keep_alive = 10
        self.inactive_limit = 10

    def set_reservation(self, the_uuid, request):
        game_name = request.get("game_name", "unknown")
        # request['uuid'] = the_uuid
        if not request["uuid"] in self.reservations:
            # test if this oidid is already present in the reservations
            us = [u for u,r in self.reservations.items() if r.get('oidid','') == request.get('oidid','')]
            for u in us:
                self.remove_reservation(u)
            for game_id, game in self.games.items():
                if game_name == game.game_name:
                    request["game_id"] = game_id
                    break
            else:
                # game_name not found
                raise Exception(f"unknown game: {game_name}")
            request["timestamp"] = datetime.datetime.now()
            request["regtime"] = datetime.datetime.now()
            request["player_id"] = str(uuid.uuid4())
            request["status"] = "registered"
            self.reservations[request["uuid"]] = request
            self.player2reservation[request["player_id"]] = request["uuid"]
        else:
            raise Exception(f"illegal reservation request")

    def confirm_reservation(self, uuid):
        if uuid not in self.done_reservations:
            self.done_reservations[uuid] = uuid
            return self.reservations.get(uuid, None)
        else:
            return None

    def get_reservation(self, uuid):
        return self.reservations.get(uuid, None)

    def update_reservation(self, uuid, status):
        request = self.reservations.get(uuid, None)
        if request:
            request["status"] = status
            self.reservations[request["uuid"]] = request
        return request

    def remove_reservation(self, uuid):
        if uuid in self.reservations:
            res = self.reservations[uuid]
            player_id = res["player_id"]
            if player_id in self.player2reservation:
                del self.player2reservation[player_id]
            del self.reservations[uuid]

    def game_status_event(self, request):
        events = []
        game_id = request["game_id"]
        msg = request["msg"]
        if game_id not in self.games:
            if msg == "CREATED":
                self.add_game(game_id, request)
            else:
                logger.warning(f"unexpected message from game: {game_id}")
                return
        now = datetime.datetime.now()
        self.lastseen[game_id] = now
        game_status = self.games[game_id]
        if msg == "STARTED":
            game_status.started(self.now, request)
        elif msg == "GAMETICK":
            game_status.gametick(self.now, request)
        elif msg == "DELTAREC":
            game_status.deltarec(self.now, request)
        elif msg == "STOPPED":
            game_status.stopped(self.now, request)
            self.remove_game(game_id)
        elif msg == "CREATED":
            # CREATED event is already handled
            pass
        elif msg == "PLAYER_REGISTER":
            game_id = request["game_id"]
            player_id = request["data"]["player_id"]
            player_name = request["data"]["player_name"]
            if player_id in self.player2reservation:
                uid = self.player2reservation[player_id]
                reservation = self.get_reservation(uid)
                if reservation["status"] != "stopped":
                    events.append({
                        "msg": "PLAYER_REGISTER",
                        "game_id": game_id,
                        "player_id": player_id,
                        "uuid": uid,
                        "reservation": reservation})
            game_status.player_register(now, player_id, player_name, request)
        elif msg == "PLAYER_DEREGISTER":
            game_id = request["game_id"]
            player_id = request["data"]["player_id"]
            if player_id in self.player2reservation:
                uid = self.player2reservation[player_id]
                reservation = self.get_reservation(uid)
                if reservation["status"] != "stopped":
                    events.append({
                        "msg": "PLAYER_DEREGISTER",
                        "game_id": game_id,
                        "player_id": player_id,
                        "uuid": uid,
                        "reservation": reservation})
            game_status.player_deregister(now, player_id, request)
        elif msg == "PLAYER_SUCCESS":
            game_id = request["game_id"]
            player_id = request["data"]["player_id"]
            if player_id in self.player2reservation:
                uid = self.player2reservation[player_id]
                reservation = self.get_reservation(uid)
                if reservation["status"] != "stopped":
                    events.append({
                        "msg": "PLAYER_SUCCESS",
                        "game_id": game_id,
                        "player_id": player_id,
                        "uuid": uid,
                        "reservation": reservation})
                    self.update_reservation(uid, "stopped")
            game_status.player_success(now, player_id, request)
        elif msg == "PLAYER_FAILURE":
            game_id = request["game_id"]
            player_id = request["data"]["player_id"]
            if player_id in self.player2reservation:
                uid = self.player2reservation[player_id]
                reservation = self.get_reservation(uid)
                if reservation["status"] != "stopped":
                    events.append({
                        "msg": "PLAYER_FAILURE",
                        "game_id": game_id,
                        "player_id": player_id,
                        "uuid": uid,
                        "reservation": reservation})
                    self.update_reservation(uid, "stopped")
            game_status.player_failure(now, player_id, request)
        elif msg == "IDLE":
            pass
        else:
            logger.warning(f"unknown msg: {msg}")
        return events

    def add_game(self, game_id, request):
        game_status = GameStatus(self.now, request)
        self.games[game_id] = game_status

    def remove_game(self, game_id):
        # when removing a game, update the status of all reservations
        if game_id in self.games:
            for player_id in self.games[game_id].players:
                uid = self.player2reservation[player_id]
                self.update_reservation(uid, "stopped")
            del self.games[game_id]
            del self.lastseen[game_id]

    def list_games(self):
        result = {}
        for game_id, game in self.games.items():
            result[game_id] = game.game_name
        return result

    def get_game_map(self, game_id):
        if game_id in self.games:
            return self.games[game_id].game_map()
        else:
            return {}

    def get_game_status(self, game_id):
        game_status = {}
        if game_id in self.games:
            game_status = self.games[game_id].game_status()
        return game_status

    def get_player_status(self, game_id, player_id):
        player_status = {}
        if game_id in self.games:
            if player_id in self.games[game_id].players:
                player_status = self.games[game_id].player_status(player_id)
                game_status = self.get_game_status(game_id)
                player_status["game_status"] = game_status
        return player_status

    def get_game_recording(self, game_id, before_game_time):
        game_recording = []
        if game_id in self.games:
            game_recording = self.games[game_id].game_recording(before_game_time)
        return game_recording

    def timer(self, now):
        if not robotjes.debug_mode and (not self.now or (now - self.now).total_seconds() > 10):
            self.now = now
            # check for game timeouts
            for game_id, game in self.games.copy().items():
                # check for 'stopped for long enough'
                if game.is_stopped():
                    if (now - game.stoptime).total_seconds() > self.keep_alive:
                        logger.warning(f"old game: {game_id}")
                        self.remove_game(game_id)
                # check for 'inactive'
                if game_id in self.lastseen and self.games[game_id].isStarted:
                    if (now - self.lastseen[game_id]).total_seconds() > self.inactive_limit:
                        logger.warning(f"inactive game: {game_id}")
                        self.remove_game(game_id)
            # check for reservation timeouts
            for uid, request in self.reservations.copy.items():
                if request["status"] == "registered" and (now - request["regtime"] > self.inactive_limit):
                    self.remove_reservation(uid)


class GameStatus(object):
    """Contains three pieces of information about a game:
    1. The current game status (from the latest received delta)
    2. The current player status (from the latest received delta)
    3. A list of deltas (a recording?)
    """

    def __init__(self, now, delta):
        """creation with an initial delta"""
        self.bubble_id = delta["bubble_id"]
        self.game_id = delta["game_id"]
        self.game_name = delta["game_name"]
        self.maze_map = delta["data"]["maze_map"]
        self.starttime = now
        self.stoptime = None
        self.game_tick = 0
        self.isStarted = False
        self.isStopped = False
        self.isSuccess = False
        self.recording = []
        self.players = {}
        self.mapstatus = None
        self.data = {}
        self.gametick(now, delta)

    def is_stopped(self):
        return self.stoptime is not None

    def started(self, now, request):
        pass

    def stopped(self, now, request):
        self.stoptime = now

    def player_register(self, now, player_id, player_name, request):
        self.players[player_id] = {
            "player_id": player_id,
            "player_name": player_name,
            "active": True,
            "success": False,
            "first_seen": now,
            "last_seen": now,
            "first_tick": request["game_status"]["game_tick"],
            "last_tick": -1
        }

    def player_deregister(self, now, player_id, request):
        if player_id in self.players:
            self.players[player_id]["last_seen"] = now
            self.players[player_id]["active"] = False
            self.players[player_id]["last_tick"] = request["game_status"]["game_tick"]

    def player_success(self, now, player_id, request):
        if player_id in self.players:
            self.players[player_id]["last_seen"] = now
            self.players[player_id]["success"] = True
            self.players[player_id]["last_tick"] = request["game_status"]["game_tick"]

    def player_failure(self, now, player_id, request):
        if player_id in self.players:
            self.players[player_id]["last_seen"] = now
            self.players[player_id]["success"] = False
            self.players[player_id]["last_tick"] = request["game_status"]["game_tick"]

    def gametick(self, now, request):
        self.game_tick = request["game_status"]["game_tick"]
        self.isStarted = request["game_status"]["isStarted"]
        self.isStopped = request["game_status"]["isStopped"]
        self.isSuccess = request["game_status"]["isSuccess"]
        for player_id, player_status in request["players_status"].items():
            if player_id in self.players:
                self.players[player_id]["last_seen"] = now
                self.players[player_id]["counters"] = player_status["counters"]
                self.players[player_id]["robos"] = player_status["robos"]

    def deltarec(self, now, request):
        recording_delta = request["data"]
        # print(f"status_keeper/deltarec[{recording_delta['game_tick']}]")
        self.recording.append(recording_delta)
        if len(self.recording) > 10:
            self.recording.pop(0)

    def game_status(self):
        # short status of the game
        players = []
        for player_id, player in self.players.items():
            players.append(player["player_name"])

        return {
            "game_id": self.game_id,
            "game_name": self.game_name,
            "status": {
                "game_tick": self.game_tick,
                "isStarted": self.isStarted,
                "isStopped": self.isStopped,
                "isSuccess": self.isSuccess,
            },
            "players": players,
        }

    def game_map(self):
        reply = self.game_status()
        reply["maze_map"] = self.maze_map
        return reply

    def game_recording(self, before_game_time):
        result = []
        for rec in self.recording:
            if rec["game_tick"] > before_game_time:
                result.append(rec)
        return result

    def player_status(self, player_id):
        if player_id in self.players:
            if player_id in self.players:
                player_status = self.players[player_id]
            else:
                player_status = {}
            return {
                "game_status": self.game_status(),
                "player_status": player_status,
            }
        else:
            return {}
