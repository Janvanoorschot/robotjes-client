from robotjes.sim import Engine, Map, WorldEvent
from . import FieldEvent


class RoboGame:
    """ Robotjes specific game behaviour. """
    def __init__(self, mapstr, counters={}):
        self.robos = {}
        self.counters = counters
        self.map = Map.fromstring(mapstr)
        self.engine = Engine(self.map)
        self.engine.world.beacons.clear()
        self.beacon_count = 1
        self._update_beacons()
        self.engine.add_listener(self._world_event)
        self.game_tick = 0
        self.last_recording_delta = 0
        self.robo_counters = {}
        for evt in WorldEvent:
            self.robo_counters[evt] = {}
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
        robo_id = data["robo_id"]
        self.robo_counters[evt][robo_id] += 1
        self._test_counters(robo_id, data)
        if evt == WorldEvent.WORLD_EVT_BEACON_EATEN:
            self._update_beacons()

    def _test_counters(self, robo_id:str, data: dict):
        # first check
        for evt in WorldEvent:
            if "max" in self.counters and evt in self.counters["max"]:
                if self.robo_counters[evt][robo_id] >= self.counters["max"][evt]:
                    # the robo exceded a given limit
                    data["world_event"] = evt
                    self.event(FieldEvent.FIELD_EVT_LIMIT_REACHED, data)
        for evt in WorldEvent:
            if "min" in self.counters and evt in self.counters["min"]:
                if self.robo_counters[evt][robo_id] >= self.counters["min"][evt]:
                    # robo completed a task
                    data["world_event"] = evt
                    self.event(FieldEvent.FIELD_EVT_TASK_DONE, data)

    def _update_beacons(self):
        while len(self.engine.world.beacons) < self.beacon_count:
            # find a next position
            for pos in self.engine.world.map.beacons:
                if self.engine.world.available_pos(pos):
                    self.engine.world.beacons.add(pos)
                    break

    def create_robo(self, player_id):
        robo_id = self.engine.create_robo()
        if robo_id:
            self.robos[robo_id] = {
                'player': player_id
            }
            for evt in WorldEvent:
                self.robo_counters[evt][robo_id] = 0
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
