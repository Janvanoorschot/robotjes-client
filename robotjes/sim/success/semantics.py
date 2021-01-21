# semantics.

class Semantics:

    def __init__(self):
        self.opers = {
            "clear": self.check,
            "obstacle": self.check,
            "beacon": self.check,
            "white": self.check,
            "black": self.check,
            "nopaint": self.check,
            "robot": self.check,
            "maxEats": self.maxEats,
            "robotHasBeacon": self.robotHasBeacon,
            "robotHasBumped": self.robotHasBumped,
            "minWhitePaintUsed": self.minWhitePaintUsed,
            "minBlackPaintUsed": self.minBlackPaintUsed,
            "putDown": self.true,
            "pickUp": self.true,
        }

    def eval(self, identifier, args, world):
        if identifier in self.opers:
            oper = self.opers[identifier]
            return oper(identifier, args, world)
        else:
            print(f"unknown Semantics: {identifier}")
            return True

    def check(self, identifier, args, world):
        # note that the identifier name need to match the constants defined in world.py
        if len(args) < 2:
            return False
        pos = (args[0], args[1])
        return world.check_pos(pos, identifier)

    def maxEats(self, identifier, args, world):
        if len(args) != 1:
            return False
        return world.get("eats") < args[0]

    def robotHasBeacon(self, identifier, args, world):
        owned_beacons = 0
        for bot in world.bots.values():
            owned_beacons = owned_beacons + len(bot.beacons)
        return owned_beacons > 0

    def robotHasBumped(self, identifier, args, world):
        return world.get("robotHasBumped") > 0

    def minWhitePaintUsed(self, identifier, args, world):
        if len(args) != 1:
            return False
        return world.profile["whitePaintUsed"] >= args[0]

    def minBlackPaintUsed(self, identifier, args, world):
        if len(args) != 1:
            return False
        return world.profile["blackPaintUsed"] >= args[0]

    def true(self, identifier, args, world):
        return True

ROBO_SEMANTICS = Semantics()