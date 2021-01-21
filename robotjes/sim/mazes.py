import os
import pathlib

class Mazes(object):

    def __init__(self, dir):
        self.dir = dir
        self.mapfiles = {}
        self.mazes = {}
        for path in list(pathlib.Path(self.dir).glob("*.map")):
            id = path.stem
            self.mapfiles[id] = path
            self.mazes[id] = {
                "name": id
            }

    def list_mazes(self):
        return self.mazes

    def status_maze(self, maze_id):
        if maze_id in self.mazes:
            status = {
                "maze_id": maze_id,
                "status": self.mazes[maze_id]
            }
        else:
            status = {
                "maze_id": maze_id
            }
        return status

    def get_map(self, maze_id):
        map = ""
        if maze_id in self.mazes:
            path = self.mapfiles[maze_id]
            with path.open() as f:
                for line in f:
                    map = map + line
        return map