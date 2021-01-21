import uuid
from .world import World
from .recording import Recording

LEGAL_COMMANDS = ["forward", "backward", "left", "right", "pickUp", "putDown",
                  "eatUp", "paintWhite", "paintBlack", "stopPainting",
                  "leftIsClear", "leftIsObstacle", "leftIsBeacon", "leftIsRobot", "leftIsWhite", "leftIsBlack",
                  "frontIsClear", "frontIsObstacle", "frontIsBeacon", "frontIsRobot", "frontIsWhite", "frontIsBlack",
                  "rightIsClear", "rightIsObstacle", "rightIsBeacon", "rightIsRobot", "rightIsWhite", "rightIsBlack",
                  "flipCoin", "message", "error"
                  ]
class Engine(object):

    def __init__(self, map):
        self.map = map
        self.world = World(self.map)
        self.recording = Recording()
        self.robos = {}
        self.game_time = 0

    def get_recording(self):
        return self.recording

    def get_profile(self):
        return self.world.profile

    def clean_cmd(self, cmd):
        if not cmd or not type(cmd)==list or len(cmd)< 3:
            return ["illegal"]
        [lineno, id, command, *args] = cmd
        if command not in LEGAL_COMMANDS:
            return ["unknown", 0, []]
        else:
            return [command, lineno, *args]

    def prepare_reply(self, cmd, *args):
        reply = [cmd, args]
        return reply

    def create_robo(self):
        robo_id = str(uuid.uuid4())
        if self.world.create_robo(robo_id):
            loc = self.world.getLoc(robo_id)
            dir = self.world.getDir(robo_id)
            self.robos[robo_id] = {}
            self.recording.lineno(0)
            self.recording.game_timer(self.game_time)
            self.recording.robo(robo_id)
            self.recording.create_robo(robo_id, "normal", loc[0], loc[1], dir)
            return robo_id
        else:
            return None

    def destroy_robo(self, robo_id):
        self.world.destroy_robo(robo_id)
        del self.robos[robo_id]
        self.recording.lineno(0)
        self.recording.game_timer(self.game_time)
        self.recording.robo(robo_id)
        self.recording.destroy_robo(robo_id)

    def game_timer(self, game_time):
        self.game_time = game_time

    def execute(self, game_tick, robo_id, cmd):
        if not robo_id in self.robos:
            reply = [[False]]
            return self.prepare_reply(cmd, reply)
        [command, lineno, *args] = self.clean_cmd(cmd)
        bot = self.world.bots[robo_id]
        success = False
        reply = []
        self.world.inc("scriptCalls")
        self.world.inc("scriptBasicCommands")
        self.recording.lineno(lineno)
        self.recording.game_timer(self.game_time)
        self.recording.robo(robo_id)
        if command == "forward":
            expected = 1 if len(args) < 1 else int(args[0])
            actual = 0
            for i in range(expected):
                next_pos = self.world.calc_pos(bot, self.world.FRONT, +1)
                if next_pos and self.world.available_pos(next_pos):
                    success = self.world.move_to(robo_id, next_pos)
                    reply.append([success, next_pos])
                    actual = actual + 1
                else:
                    self.recording.boom(cmd)
                    reply.append([False, next_pos])
                    self.world.inc("robotHasBumped")
            success = (expected == actual)
            self.recording.forward(actual, expected)
        elif command == "backward":
            expected = 1 if len(args) < 1 else int(args[0])
            actual = 0
            for i in range(expected):
                next_pos = self.world.calc_pos(bot, self.world.FRONT, -1)
                if next_pos and self.world.available_pos(next_pos):
                    success = self.world.move_to(robo_id, next_pos)
                    reply.append([success, next_pos])
                    actual = actual + 1
                else:
                    self.recording.boom(cmd)
                    reply.append([False, next_pos])
                    self.world.inc("robotHasBumped")
            success = (expected == actual)
            self.recording.backward(actual, expected)
        elif command == "right":
            expected = 1 if len(args) < 1 else int(args[0])
            for i in range(expected):
                dir = self.world.right(robo_id)
                reply.append([True, dir])
            success = True
            self.recording.right(expected)
        elif command == "left":
            expected = 1 if len(args) < 1 else int(args[0])
            for i in range(expected):
                dir = self.world.left(robo_id)
                reply.append([True, dir])
            success = True
            self.recording.left(expected)
        elif command == "pickUp":
            success = self.world.pickUp(robo_id)
            reply.append([success])
            self.recording.pickUp(success)
        elif command == "putDown":
            success = self.world.putDown(robo_id)
            reply.append([success])
            self.recording.putDown(success)
        elif command == "eatUp":
            success = self.world.eatUp(robo_id)
            reply.append([success])
            self.recording.eatUp(success)
        elif command == "paintWhite":
            start = self.world.paintWhite(robo_id)
            reply.append([start])
            success = True
            self.recording.paintWhite(start)
        elif command == "paintBlack":
            start = self.world.paintBlack(robo_id)
            reply.append([start])
            success = True
            self.recording.paintBlack(start)
        elif command == "stopPainting":
            start = self.world.stopPainting(robo_id)
            reply.append([start])
            success = True
            self.recording.stopPainting()
        elif command == "leftIsClear":
            success = self.world.check(robo_id, World.LEFT, World.CLEAR)
            self.recording.see("left", "clear")
            reply.append([success])
            self.world.inc("see")
        elif command == "leftIsObstacle":
            success = self.world.check(robo_id, World.LEFT, World.OBSTACLE)
            self.recording.see("left", "obstacle")
            reply.append([success])
            self.world.inc("see")
        elif command == "leftIsBeacon":
            success = self.world.check(robo_id, World.LEFT, World.BEACON)
            self.recording.see("left", "beacon")
            reply.append([success])
            self.world.inc("see")
        elif command == "leftIsRobot":
            success = self.world.check(robo_id, World.LEFT, World.ROBOT)
            self.recording.see("left", "robot")
            reply.append([success])
            self.world.inc("see")
        elif command == "leftIsWhite":
            success = self.world.check(robo_id, World.LEFT, World.WHITE)
            self.recording.see("left", "white")
            reply.append([success])
            self.world.inc("see")
        elif command == "leftIsBlack":
            success = self.world.check(robo_id, World.LEFT, World.BLACK)
            self.recording.see("left", "black")
            reply.append([success])
            self.world.inc("see")
        elif command == "frontIsClear":
            success = self.world.check(robo_id, World.FRONT, World.CLEAR)
            self.recording.see("front", "clear")
            reply.append([success])
            self.world.inc("see")
        elif command == "frontIsObstacle":
            success = self.world.check(robo_id, World.FRONT, World.OBSTACLE)
            self.recording.see("front", "obstacle")
            reply.append([success])
            self.world.inc("see")
        elif command == "frontIsBeacon":
            success = self.world.check(robo_id, World.FRONT, World.BEACON)
            self.recording.see("front", "beacon")
            reply.append([success])
            self.world.inc("see")
        elif command == "frontIsRobot":
            success = self.world.check(robo_id, World.FRONT, World.ROBOT)
            self.recording.see("front", "robot")
            reply.append([success])
            self.world.inc("see")
        elif command == "frontIsWhite":
            success = self.world.check(robo_id, World.FRONT, World.WHITE)
            self.recording.see("front", "white")
            reply.append([success])
            self.world.inc("see")
        elif command == "frontIsBlack":
            success = self.world.check(robo_id, World.FRONT, World.BLACK)
            self.recording.see("front", "black")
            reply.append([success])
            self.world.inc("see")
        elif command == "rightIsClear":
            success = self.world.check(robo_id, World.RIGHT, World.CLEAR)
            self.recording.see("right", "clear")
            reply.append([success])
            self.world.inc("see")
        elif command == "rightIsObstacle":
            success = self.world.check(robo_id, World.RIGHT, World.OBSTACLE)
            self.recording.see("right", "obstacle")
            reply.append([success])
            self.world.inc("see")
        elif command == "rightIsBeacon":
            success = self.world.check(robo_id, World.RIGHT, World.BEACON)
            self.recording.see("right", "beacon")
            reply.append([success])
            self.world.inc("see")
        elif command == "rightIsRobot":
            success = self.world.check(robo_id, World.RIGHT, World.ROBOT)
            self.recording.see("right", "robot")
            reply.append([success])
            self.world.inc("see")
        elif command == "rightIsWhite":
            success = self.world.check(robo_id, World.RIGHT, World.WHITE)
            self.recording.see("right", "white")
            reply.append([success])
            self.world.inc("see")
        elif command == "rightIsBlack":
            success = self.world.check(robo_id, World.RIGHT, World.BLACK)
            self.recording.see("right", "black")
            reply.append([success])
            self.world.inc("see")
        elif command == "flipCoin":
            success = self.world.flipCoin()
            self.recording.flipCoin()
            reply.append([success])
            self.world.inc("flipCoins")
        elif command == "message":
            message = "unknown" if len(args) < 1 else args[0]
            loc = self.world.getLoc(robo_id)
            cargo = self.world.getCargo(robo_id)
            paint = self.world.getPaint(robo_id)
            message = message.format(loc=loc, cargo=cargo, paint=paint)
            self.recording.message(message)
            success = True
        elif command == "error":
            message = "none" if len(args) < 1 else args[0]
            if len(message) > 1 and message != "none":
                self.recording.error(message)
            success = False
        else:
            success = False
            reply.append([False])
        bot.record(game_tick, command, args, success)
        return self.prepare_reply(cmd, reply)

    def get_status(self, robo_id):
        return self.world.get_status(robo_id)

    def get_map_status(self):
        result = self.world.get_map_status()
        result['game_time'] = self.game_time
        return result



