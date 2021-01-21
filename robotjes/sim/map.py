import re

class Map(object):
    """ An immutabel representation of the map of a maze."""

    def __init__(self):
        self.height = 0
        self.width = 0
        self.extras = []
        self.extras_type = {}
        self.paints_black = []
        self.paints_black_type = {}
        self.paints_white = []
        self.paints_white_type = {}
        self.tiles = []
        self.tiles_type = {}
        self.startposses = []
        self.beacons = []

    def start_positions(self):
        return list(self.startposses)

    def start_beacons(self):
        return list(self.beacons)

    def contains_pos(self, pos):
        return pos[0]>=0 and pos[0]<self.width and pos[1]>=0 and pos[1]<self.height

    def available_pos(self, pos):
        return pos not in self.tiles

    def toMazeMap(self):
        result = {}
        mapLines = []
        for y in range(0, self.height):
            line = []
            for x in range(0, self.width):
                coord = (x,y)
                if coord in self.tiles_type:
                    line.append(self.tiles_type[coord])
                else:
                    if coord in self.beacons:
                        line.append("*")
                    else:
                        if coord in self.startposses:
                            line.append("@")
                        else:
                            line.append(" ")
            mapLines.append(line)
        result["mapLines"] = mapLines
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
        extraLines = []
        for item in self.extras:
            cell = {}
            cell["x"] = item[0]
            cell["y"] = item[1]
            cell["id"] = self.extras_type[item]
            extraLines.append(cell)
        result["extraLines"] = extraLines
        robotLines = []
        for item in self.startposses:
            cell = {}
            cell["id"] = "Robo"
            cell["x"] = item[0]
            cell["y"] = item[1]
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



    @classmethod
    def fromfile(cls, file):
        with open(file) as f:
            return cls.fromlist(f)

    @classmethod
    def fromstring(cls, string):
        list = string.split("\n")
        return cls.fromlist(list)

    @classmethod
    def fromlist(cls, list):
        builder = MapBuilder()
        reader = MapReader(list, builder)
        reader.read()
        return builder.build()

class MapBuilder(object):

    def __init__(self):
        self.height = 0
        self.width = 0
        self.extras = []
        self.extras_type = {}
        self.paints_black = []
        self.paints_black_type = {}
        self.paints_white = []
        self.paints_white_type = {}
        self.tiles = []
        self.tiles_type = {}
        self.startposses = []
        self.beacons = []

    def extra(self,type,x,y):
        self.extras.append((x,y))
        self.extras_type[(x,y)] = type

    def paint(self, color, type, x, y):
        pos = (x,y)
        if color == "b":
            self.paints_black.append(pos)
            if pos in self.paints_black_type:
                self.paints_black_type[pos].append(type)
            else:
                self.paints_black_type[pos] = [type]
        else:
            self.paints_white.append(pos)
            if pos in self.paints_white_type:
                self.paints_white_type[pos].append(type)
            else:
                self.paints_white_type[pos] = [type]

    def beacon(self, x, y):
        self.coord(x,y)
        self.beacons.append((x,y))

    def startpos(self, x, y):
        self.coord(x,y)
        self.startposses.append((x,y))

    def tile(self, x, y, t):
        self.coord(x,y)
        self.tiles.append((x,y))
        self.tiles_type[(x,y)] = t

    def coord(self, x, y):
        if self.width < x:
            self.width = x
        if self.height < y:
            self.height = y

    def build(self):
        mapper = Map()
        mapper.width = self.width+1
        mapper.height = self.height+1
        mapper.extras = self.extras
        mapper.extras_type = self.extras_type
        mapper.paints_black = self.paints_black
        mapper.paints_black_type = self.paints_black_type
        mapper.paints_white = self.paints_white
        mapper.paints_white_type = self.paints_white_type
        mapper.tiles = self.tiles
        mapper.tiles_type = self.tiles_type
        mapper.startposses = self.startposses
        mapper.beacons = self.beacons
        return mapper

class MapReader(object):

    def __init__(self, f, builder):
        self.f = f
        self.builder = builder
        self.blokline = re.compile(r"""(\S+):""")
        self.extraline = re.compile(r"""(\S+)@(\d+),(\d+)""")
        self.paintline = re.compile(r"""\s*([wb])\s*,\s*([.\-|])\s*,\s*(\d+)\s*,\s*(\d+)\s*""")
        self.section = None
        self.nextx = 0
        self.nexty = 0

    def read(self):
        for line in self.f:
            if not line.startswith("#"):
                blockhead = self.blokline.match(line)
                if blockhead:
                    section = blockhead.group(1)
                    if section == 'extra':
                        self.section = 'extra'
                    elif section == 'map':
                        self.section = 'map'
                    elif section == 'paint':
                        self.section = 'paint'
                else:
                    if self.section == "extra":
                        self.extra_line(line)
                    elif self.section == "map":
                        self.map_line(line)
                    elif self.section == 'paint':
                        self.paint_line(line)

    def extra_line(self, line):
        extramatch = self.extraline.match(line)
        if extramatch:
            type = extramatch.group(1)
            x = int(extramatch.group(2))
            y = int(extramatch.group(3))
            self.builder.extra(type,x,y)

    def map_line(self, line):
        self.nextx = 0
        for ch in line:
            if ch == '@':
                self.builder.startpos(self.nextx, self.nexty)
            elif ch == '*':
                    self.builder.beacon(self.nextx, self.nexty)
            elif ch in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
                    self.builder.tile(self.nextx, self.nexty, ch)
            self.nextx = self.nextx + 1
        self.nexty = self.nexty + 1

    def paint_line(self, line):
        all = re.findall("\((.*?)\)", line)
        for item in all:
            paintmatch = self.paintline.match(item)
            if paintmatch:
                color = paintmatch.group(1)
                type = paintmatch.group(2)
                x = int(paintmatch.group(3))
                y = int(paintmatch.group(4))
                self.builder.paint(color,type,x,y)



