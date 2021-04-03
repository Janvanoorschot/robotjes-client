from robotjes.sim import Engine, Map, WorldEvent
from . import FieldEvent


class RoboGame:
    """ Robotjes specific game behaviour. """
    def __init__(self, mapstr, max_counters={}):
        self.robos = {}
        self.max_counters = max_counters
        self.map = Map.fromstring(mapstr)
        self.engine = Engine(self.map)
        self.engine.add_listener(self._world_event)
        self.game_tick = 0
        self.last_recording_delta = 0
        self.robo_counters = {
            "min": {},
            "max": {}
        }
        self.listeners = []

    def add_listener(self, listener):
        if callable(listener) and listener not in self.listeners:
            self.listeners.append(listener)

    def remove_listener(self, listener):
        if listener in self.listeners:
            self.listeners.remove(listener)

    def event(self, event: FieldEvent, data: dict):
        for listener in self.listeners:
            listener(event, data)

    def _world_event(self, evt: WorldEvent, data: map):
        if evt == WorldEvent.WORLD_EVT_BUMP:
            robo_id = data["robo_id"]
            self.robo_counters[FieldEvent.FIELD_EVT_MAX_BUMP][robo_id] += 1
            if self.robo_counters[FieldEvent.FIELD_EVT_MAX_BUMP][robo_id] > self.max_counters["FieldEvent.FIELD_EVT_MAX_BUMP"]:
                self.event(FieldEvent.FIELD_EVT_MAX_HIT_BOT, data)
        elif evt == WorldEvent.WORLD_EVT_HIT_BOT:
            robo_id = data["robo_id"]
            self.robo_counters[FieldEvent.FIELD_EVT_MAX_HIT_BOT][robo_id] += 1
            if self.robo_counters[FieldEvent.FIELD_EVT_MAX_HIT_BOT][robo_id] > self.max_counters[FieldEvent.FIELD_EVT_MAX_HIT_BOT]:
                self.event(FieldEvent.FIELD_EVT_MAX_HIT_BOT, data)
        elif evt == WorldEvent.WORLD_EVT_BEACON_EATEN:
            robo_id = data["robo_id"]
            self.robo_counters[FieldEvent.FIELD_EVT_MAX_BEACON_EATEN][robo_id] += 1
            if self.robo_counters[FieldEvent.FIELD_EVT_MAX_BEACON_EATEN][robo_id] > self.max_counters[FieldEvent.FIELD_EVT_MAX_BEACON_EATEN]:
                self.event(FieldEvent.FIELD_EVT_MAX_BEACON_EATEN, data)

    def create_robo(self, player_id):
        robo_id = self.engine.create_robo()
        if robo_id:
            self.robos[robo_id] = {
                'player': player_id
            }
            self.robo_counters["bumps"][robo_id] = 0
            self.robo_counters["hits"][robo_id] = 0
            self.robo_counters["eats"][robo_id] = 0
            return robo_id
        else:
            return None

    def destroy_robo(self, robo_id):
        self.engine.destroy_robo(robo_id)
        del self.robos[robo_id]

    def start_moves(self, game_tick):
        self.game_tick = game_tick
        self.engine.game_timer(game_tick)

    def execute(self, game_tick, robo_id, move):
        # execute the move for the given robo
        self.engine.execute(game_tick, robo_id, move)

    def end_moves(self, game_tick):
        pass

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
            cur_tick = frames[ix]['tick']
            while ix < len(frames) and frames[ix]['tick'] == cur_tick:
                frame.append(frames[ix])
                ix = ix + 1
            combined_frames.append(frame)
        return {
            "game_tick": self.game_tick,
            "frames": combined_frames,
            "map_status": map_status
        }

    def maze_map(self):
        return self.map.toMazeMap()

    def get_map_status(self):
        return self.engine.get_map_status()
