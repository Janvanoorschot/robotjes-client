import random
import logging
import collections

logger = logging.getLogger(__name__)


class World(object):

    # directions
    LEFT = 90
    FRONT = 0
    RIGHT = 270
    BACK = 180

    # status of position
    CLEAR = "clear"
    OBSTACLE = "obstacle"
    BEACON = "beacon"
    WHITE = "white"
    BLACK = "black"
    NOPAINT = "nopaint"
    ROBOT = "robot"

    def __init__(self, map):
        self.map = map
        self.paints_black = set(self.map.paints_black)
        self.paints_black_type = self.map.paints_black_type.copy()
        self.paints_white = set(self.map.paints_white)
        self.paints_white_type = self.map.paints_white_type.copy()
        self.beacons = set(self.map.start_beacons())
        self.bots = {}
        self.profile = {
            "paintWhites": 0,
            "paintBlacks": 0,
            "whitePaintUsed": 0,
            "blackPaintUsed": 0,
            "robotHasBumped": 0,
            "scriptTotalCharacters": 0,
            "scriptCharacters": 0,
            "scriptCalls": 0,
            "scriptBasicCommands": 0,
            "see": 0,
            "flipCoins": 0,
            "robotHasBeacon": 0,
            "exploredTileCount": 0,
            "scriptRecursive": 0,
            "successfulGets": 0,
            "robotOrientation": 0,
            "gets": 0,
            "puts": 0,
            "eats": 0,
            "successfulEats": 0,
            "moves": 0,
            "explored": 0,
            "robotActions": 0,
            "robotX": 0,
            "robotY": 0,
            "successfulPuts": 0,
            "total": 0,
        }

    def create_robo(self, robo_id):
        ix_start_position = len(self.bots) % len(self.map.start_positions())
        start_position = self.map.start_positions()[ix_start_position]
        if self.available_pos(start_position):
            bot = Bot(start_position, 90)
            self.bots[robo_id] = bot
            return True
        else:
            return False

    def destroy_robo(self, robo_id):
        del self.bots[robo_id]

    def getLoc(self, robo_id):
        if robo_id in self.bots:
            return self.bots[robo_id].pos
        else:
            raise Exception(f"unknown robo: {robo_id}")

    def getDir(self, robo_id):
        if robo_id in self.bots:
            return self.bots[robo_id].dir
        else:
            raise Exception(f"unknown robo: {robo_id}")

    def getCargo(self, robo_id):
        if robo_id in self.bots:
            return len(self.bots[robo_id].beacons)
        else:
            raise Exception(f"unknown robo: {robo_id}")

    def getPaint(self, robo_id):
        if robo_id in self.bots:
            return self.bots[robo_id].paint
        else:
            raise Exception(f"unknown robo: {robo_id}")

    def inc(self, name, count=1):
        if(name in self.profile):
            self.profile[name] = self.profile[name] + count
        else:
            logger.warning(f"unknown profile variable: {name}")

    def get(self, name):
        if(name in self.profile):
            return self.profile[name]
        else:
            logger.warning(f"unknown profile variable: {name}")
            return 0

    def available_pos(self, pos):
        available = self.map.available_pos(pos)
        available = available and not (pos in self.beacons)
        available = available and not (pos in [robo.pos for robo in self.bots.values()])
        return available

    def calc_pos(self, bot, viewdir, dist):
        pos = bot.pos
        dir = dir_add(bot.dir,viewdir)
        x = pos[0]
        y = pos[1]
        if dir == 0:
            x = x + dist
        elif dir == 90:
            y = y - dist
        elif dir == 180:
            x = x - dist
        elif dir == 270:
            y = y + dist
        new_pos = (x,y)
        if self.map.contains_pos(new_pos):
            return new_pos
        else:
            return None

    def move_to(self, robo_id, pos):
        if robo_id in self.bots and self.available_pos(pos):
            bot = self.bots[robo_id]
            bot.pos = pos
            self.paint(robo_id, start=False)
            return True
        else:
            return False

    def left(self, robo_id):
        if robo_id in self.bots:
            return self.bots[robo_id].left()
        else:
            return False

    def right(self, robo_id):
        if robo_id in self.bots:
            return self.bots[robo_id].right()
        else:
            return False

    def pickUp(self, robo_id):
        if robo_id in self.bots and self.check(robo_id, World.FRONT, World.BEACON):
            self.inc("gets")
            bot = self.bots[robo_id]
            front = self.calc_pos(bot, self.FRONT, 1)
            self.beacons.remove(front)
            bot.beacons.add(front)
            return True
        else:
            return False

    def eatUp(self, robo_id):
        if robo_id in self.bots and self.check(robo_id, World.FRONT, World.BEACON):
            self.inc("eats")
            self.inc("successfulEats")
            bot = self.bots[robo_id]
            front = self.calc_pos(bot, self.FRONT, 1)
            self.beacons.remove(front)
            return True
        else:
            return False

    def putDown(self, robo_id):
        if robo_id in self.bots and self.check(robo_id, World.FRONT, World.CLEAR) and len(self.bots[robo_id].beacons) > 0:
            self.inc("puts")
            self.inc("successfulPuts")
            bot = self.bots[robo_id]
            front = self.calc_pos(bot, self.FRONT, 1)
            bot.beacons.pop()
            self.beacons.add(front)
            return True
        else:
            return False

    def paintWhite(self, robo_id):
        if robo_id in self.bots:
            bot = self.bots[robo_id]
            start = True
            if bot.paint == self.WHITE:
                start = False
            bot.paint = self.WHITE
            self.paint(robo_id)
            return start
        else:
            return False

    def paintBlack(self, robo_id):
        if robo_id in self.bots:
            bot = self.bots[robo_id]
            start = True
            if bot.paint == self.BLACK:
                start = False
            bot.paint = self.BLACK
            self.paint(robo_id)
            return start
        else:
            return False

    def stopPainting(self, robo_id):
        if robo_id in self.bots:
            self.bots[robo_id].paint = self.NOPAINT
            return True
        else:
            return False

    def paint(self, robo_id, start=True):
        if robo_id in self.bots:
            bot = self.bots[robo_id]
            if bot.paint == self.BLACK:
                if bot.pos in self.paints_white:
                    self.inc("paintWhites", -1)
                    self.paints_white.discard(bot.pos)
                    del self.paints_white_type[bot.pos]
                self.paints_black.add(bot.pos)
                if start:
                    if bot.pos in self.paints_black_type:
                        self.paints_black_type[bot.pos].append('.')
                    else:
                        self.paints_black_type[bot.pos] = ['.']
                else:
                    if bot.dir == self.LEFT or bot.dir == self.RIGHT:
                        if bot.pos in self.paints_black_type:
                            self.paints_black_type[bot.pos].append('-')
                        else:
                            self.paints_black_type[bot.pos] = ['-']
                    else:
                        if bot.pos in self.paints_black_type:
                            self.paints_black_type[bot.pos].append('|')
                        else:
                            self.paints_black_type[bot.pos] = ['|']
                self.inc("blackPaintUsed")
                self.inc("paintBlacks")
            elif bot.paint == self.WHITE:
                if bot.pos in self.paints_black:
                    self.inc("paintBlacks", -1)
                    self.paints_black.discard(bot.pos)
                    del self.paints_black_type[bot.pos]
                self.paints_white.add(bot.pos)
                if start:
                    if bot.pos in self.paints_white_type:
                        self.paints_white_type[bot.pos].append('.')
                    else:
                        self.paints_white_type[bot.pos] = ['.']
                else:
                    if bot.dir == self.LEFT or bot.dir == self.RIGHT:
                        if bot.pos in self.paints_white_type:
                            self.paints_white_type[bot.pos].append('-')
                        else:
                            self.paints_white_type[bot.pos] = ['-']
                    else:
                        if bot.pos in self.paints_white_type:
                            self.paints_white_type[bot.pos].append('|')
                        else:
                            self.paints_white_type[bot.pos] = ['|']
                self.inc("whitePaintUsed")
                self.inc("paintWhites")

    def check(self, robo_id, dir, cond):
        if robo_id in self.bots:
            pos = self.calc_pos(self.bots[robo_id], dir, 1)
            return self.check_pos(pos, cond)
        else:
            return False

    def check_pos(self, pos, cond):
        if cond == self.CLEAR:
            return self.available_pos(pos)
        elif cond == self.OBSTACLE:
            return not self.available_pos(pos)
        elif cond == self.BEACON:
            return pos in self.beacons
        elif cond == self.ROBOT:
            return (pos in [robo.pos for robo in self.bots.values()])
        elif cond == self.WHITE:
            return pos in self.paints_white
        elif cond == self.BLACK:
            return pos in self.paints_black
        elif cond == self.NOPAINT:
            return pos not in self.paints_white and pos not in self.paints_black
        else:
            return False

    def flipCoin(self):
        return bool(random.getrandbits(1))

    def get_content(self, pos):
        tile_content = self.map.tiles_type.get(pos)
        if tile_content:
            paint = None
            bot = None
            beacon = None
        else:
            bots = [robo for robo in self.bots.values() if robo.pos==pos]
            bot = True if len(bots) > 0 else None
            beacon = True if pos in self.beacons else False
            if pos in self.paints_black:
                paint = self.BLACK
            elif pos in self.paints_white:
                paint = self.WHITE
            else:
                paint = None
        return [tile_content, paint, bot, beacon]

    def get_status(self, robo_id):
        if robo_id in self.bots:
            bot = self.bots[robo_id]
            pos_front = self.calc_pos(bot, self.FRONT, 1)
            pos_left = self.calc_pos(bot, self.RIGHT, 1)
            pos_right = self.calc_pos(bot, self.LEFT, 1)
            return {
                "pos": bot.pos,
                "load": len(bot.beacons),
                "dir": bot.dir,
                "recording": list(bot.recording),
                "fog_of_war": {
                    "left": self.get_content(pos_left),
                    "front": self.get_content(pos_front),
                    "right": self.get_content(pos_right)
                }
            }
        else:
            return {}

    def get_map_status(self):
        """ return current information about paint, bot and beacon """
        result = {}
        paintLines = []
        for item in self.paints_white:
            for t in self.paints_white_type[item]:
                cell = {}
                cell["x"] = item[0]
                cell["y"] = item[1]
                cell["type"] = t
                cell["color"] = "w"
                paintLines.append(cell)
        for item in self.paints_black:
            for t in self.paints_black_type[item]:
                cell = {}
                cell["x"] = item[0]
                cell["y"] = item[1]
                cell["type"] = t
                cell["color"] = "b"
                paintLines.append(cell)
        result["paintLines"] = paintLines
        robotLines = []
        for robo_id, robo in self.bots.items():
            cell = {}
            cell["id"] = robo_id
            cell["x"] = robo.pos[0]
            cell["y"] = robo.pos[1]
            cell["dir"] = robo.dir
            cell['beacons'] = len(robo.beacons)
            robotLines.append(cell)
        result["robotLines"] = robotLines
        beaconLines = []
        for item in self.beacons:
            cell = {}
            cell["x"] = item[0]
            cell["y"] = item[1]
            cell["type"] = "beacon"
            cell["id"] = f"[{item[0]},{item[1]}]"
            beaconLines.append(cell)
        result["beaconLines"] = beaconLines
        return result


DIRS = [0, 90, 180, 270]


def dir_left(dir):
    if not dir in DIRS:
        raise ValueError(f"invalid direction {dir}")
    return (dir + 90) % 360


def dir_right(dir):
    if not dir in DIRS:
        raise ValueError(f"invalid direction {dir}")
    return (dir + 270) % 360


def dir_add(dir1, dir2):
    if not dir1 in DIRS or not dir2 in DIRS:
        raise ValueError(f"invalid direction {dir1}/{dir2}")
    return (dir1 + dir2) % 360


class Bot(object):

    def __init__(self, start_position, dir):
        self.pos = start_position
        if not dir in DIRS:
            raise ValueError(f"invalid direction {dir}")
        self.dir = dir
        self.beacons = set()
        self.paint = None
        self.recording = collections.deque()

    def left(self):
        self.dir = dir_left(self.dir)
        return self.dir

    def right(self):
        self.dir = dir_right(self.dir)
        return self.dir

    def record(self, game_tick, command, args, success):
        # trivial simple bot recording. Used by 'get_status'
        self.recording.append([game_tick, command, args, success])
        if len(self.recording) > 3:
            self.recording.popleft()
