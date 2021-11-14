import random
from robotjes.sim import Engine, Map, WorldEvent
from . import FieldEvent


class RoboGame:
    """Robotjes specific game behaviour."""

    def __init__(self, mapstr, counters={}):
        self.map = Map.fromstring(mapstr)
        self.counters = counters

        self.robos = {}   # robo_id-> player_id
        self.players = {} # player_id -> {robo_ids}
        self.player_counters = {}   # player_id -> { evt -> counter }

        self.engine = Engine(self.map)
        self.engine.world.beacons.clear()
        self.engine.add_listener(self._world_event)

        self.beacon_count = 1
        self._update_beacons()
        self.game_tick = 0
        self.last_recording_delta = 0
        self.listeners = []

    def add_listener(self, listener):
        if callable(listener) and listener not in self.listeners:
            self.listeners.append(listener)

    def remove_listener(self, listener):
        if listener in self.listeners:
            self.listeners.remove(listener)

    def event(self, event: FieldEvent, player_id: str, data: dict):
        for listener in self.listeners:
            listener(event, player_id, data)

    def _world_event(self, evt: WorldEvent, data: dict):
        # The Engine/World has issued an event
        player_id = None
        if "player_id" in data:
            player_id = data["player_id"]
        elif "robo_id" in data and data["robo_id"] in self.robos:
            player_id = self.robos[data["robo_id"]]
        if player_id:
            self.player_counters[player_id][evt] += 1
            self._test_counters(player_id, data)
        if evt == WorldEvent.WORLD_EVT_BEACON_EATEN:
            self._update_beacons()

    def _test_counters(self, player_id: str, data: dict):
        for evt in WorldEvent:
            if "max" in self.counters and evt in self.counters["max"]:
                if self.player_counters[player_id][evt] >= self.counters["max"][evt]:
                    data["world_event"] = evt
                    self.event(FieldEvent.FIELD_EVT_LIMIT_REACHED, player_id, data)
        for evt in WorldEvent:
            if "min" in self.counters and evt in self.counters["min"]:
                if self.player_counters[player_id][evt] >= self.counters["min"][evt]:
                    data["world_event"] = evt
                    self.event(FieldEvent.FIELD_EVT_TASK_DONE, player_id, data)

    def _update_beacons(self):
        while len(self.engine.world.beacons) < self.beacon_count:
            # find a next position
            possibles = []
            for pos in self.engine.world.map.beacons:
                if self.engine.world.available_pos(pos):
                    possibles.append(pos)
            found = False
            attempts = 0
            while not found and attempts < 10:
                attempts = attempts + 1
                ix = random.randint(0, len(possibles) - 1)
                pos = possibles[ix]
                if self.engine.world.available_pos(pos):
                    self.engine.world.beacons.add(pos)
                    found = True

    def registered(self, player_id):
        self.players[player_id] = []
        self.player_counters[player_id] = {}
        for evt in WorldEvent:
            self.player_counters[player_id][evt] = 0

    def deregistered(self, player_id):
        if player_id in self.players and len(self.players[player_id]) == 0:
            del self.players[player_id]
            del self.player_counters[player_id]

    def create_robo(self, player_id):
        if player_id in self.players:
            robo_id = self.engine.create_robo()
            if robo_id:
                self.robos[robo_id] = player_id
                self.players[player_id].append(robo_id)
                return robo_id
        return None

    def destroy_robo(self, robo_id):
        if robo_id in self.robos:
            self.engine.destroy_robo(robo_id)
            player_id = self.robos[robo_id]
            self.players[player_id].remove(robo_id)
            del self.robos[robo_id]

    def start_moves(self, game_tick):
        self.game_tick = game_tick
        self.engine.game_timer(game_tick)

    def execute(self, game_tick, robo_id, move):
        # execute the move for the given robo
        if robo_id in self.robos:
            self.engine.execute(game_tick, robo_id, move)

    def end_moves(self, game_tick):
        # generate a timerevent for every player
        for player_id in self.players:
            data = {
                "player_id": player_id
            }
            self._world_event(WorldEvent.WORLD_EVT_TIMER, data)

    def get_status(self, robo_id):
        return self.engine.get_status(robo_id)

    def recording_delta(self):
        # get the frames since the last time we asked, plus our current map_status
        frames = self.engine.get_recording().toMapFrom(self.last_recording_delta)
        self.last_recording_delta = self.last_recording_delta + len(frames)
        map_status = self.get_map_status()
        # combine the frame of one timeslot together
        combined_frames = []
        ix = 0
        while ix < len(frames):
            frame = []
            cur_tick = frames[ix]["tick"]
            while ix < len(frames) and frames[ix]["tick"] == cur_tick:
                frame.append(frames[ix])
                ix = ix + 1
            combined_frames.append(frame)
        return {
            "game_tick": self.game_tick,
            "frames": combined_frames,
            "map_status": map_status,
        }

    def maze_map(self):
        return self.map.toMazeMap()

    def get_map_status(self):
        return self.engine.get_map_status()

    def get_player_counters(self, player_id):
        result = {}
        if player_id in self.player_counters:
            for evt in WorldEvent:
                if "max" in self.counters and evt in self.counters["max"]:
                    if evt in self.player_counters[player_id]:
                        cnt = self.player_counters[player_id][evt]
                    else:
                        cnt = 0
                    result[evt.name] = ['max', self.counters["max"][evt], cnt]
            for evt in WorldEvent:
                if "min" in self.counters and evt in self.counters["min"]:
                    if evt in self.player_counters[player_id]:
                        cnt = self.player_counters[player_id][evt]
                    else:
                        cnt = 0
                    result[evt.name] = ['min', self.counters["min"][evt], cnt]
        return result

