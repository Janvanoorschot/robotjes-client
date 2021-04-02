from robotjes.sim import Engine, Map

class RoboGame:
    """ Robotjes specific game behaviour. """
    def __init__(self, mapstr):
        self.robos = {}
        self.map = Map.fromstring(mapstr)
        self.engine = Engine(self.map)
        self.engine.add_listener(self._engine_event)
        self.game_tick = 0
        self.last_recording_delta = 0

    def _engine_event(self, evt, data):
        pass

    def create_robo(self, player_id):
        robo_id = self.engine.create_robo()
        if robo_id:
            self.robos[robo_id] = {
                'player': player_id
            }
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
