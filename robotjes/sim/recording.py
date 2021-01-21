import json

class Recording(object):

    def __init__(self):
        # the real keyframe
        self.keyframes = []
        # state of the recording
        self.maxsize = 10000
        self.active = True
        # variables used during the next keyframe
        self.linenumber = 1
        self.game_time = 0
        self.robo_id = None

    def len(self):
        return len(self.keyframes)

    def lineno(self, ln):
        self.linenumber = ln

    def game_timer(self, game_time):
        self.game_time = game_time

    def robo(self, robo_id):
        self.robo_id = robo_id

    def finalize_keyframe(self, keyframe):
        keyframe['ix'] = len(self.keyframes)
        keyframe['tick'] = self.game_time
        keyframe['sprite'] = self.robo_id
        keyframe['src'] = self.linenumber
        keyframe['score'] = len(self.keyframes)
        if self.active and len(self.keyframes) < self.maxsize:
            self.keyframes.append(keyframe)
        else:
            if self.active:
                # record a 'recording overflow' keyframe (only once)
                keyframe = {}
                keyframe['action'] = ['message', 'recording overflow']
                self.keyframes.append(keyframe)
                self.active = False
        return self.active

    def toMap(self):
        result = []
        for item in self.keyframes:
            result.append(item)
        return result

    def toMapFrom(self, start):
        result = []
        for ix in range(start, len(self.keyframes)):
            result.append(self.keyframes[ix])
        return result

    def isSuccess(self):
        """ we assume success if there are no messages """
        for frame in self.keyframes:
            if frame["action"][0] == 'message':
                return False
        return True

    def messages(self):
        result = []
        for frame in self.keyframes:
            if frame["action"][0] == 'message':
                result.append({
                    "msg": frame["action"][1],
                    "type": "error",
                    "line": 1
                })
        return result


    def create_robo(self, robo_id, type, x, y, dir):
        keyframe = {}
        if dir == 0:
            rdir = "right"
        elif dir == 90:
            rdir = "up"
        elif dir == 180:
            rdir = "left"
        elif dir == 270:
            rdir = "down"
        else:
            rdir = "up"
        keyframe['action'] = ['crt', robo_id, type, x, y, rdir]
        return self.finalize_keyframe(keyframe)

    def destroy_robo(self, robo_id):
        keyframe = {}
        keyframe['action'] = ['des', robo_id]
        return self.finalize_keyframe(keyframe)

    def forward(self, actual , expected):
        keyframe = {}
        keyframe['action'] = ['f', actual, expected]
        return self.finalize_keyframe(keyframe)

    def backward(self, actual, expected):
        keyframe = {}
        keyframe['action'] = ['b', actual, expected]
        return self.finalize_keyframe(keyframe)

    def left(self, actual):
        keyframe = {}
        keyframe['action'] = ['l', actual]
        return self.finalize_keyframe(keyframe)

    def right(self, actual):
        keyframe = {}
        keyframe['action'] = ['r', actual]
        return self.finalize_keyframe(keyframe)

    def see(self, direction, subject):
        # direction ["left"|"front"|right"]
        # subject ["obstacle"|"clear"|"beacon"|"white"|"black"]
        keyframe = {}
        keyframe['action'] = ['s', direction, subject]
        return self.finalize_keyframe(keyframe)

    def pickUp(self, success):
        keyframe = {}
        if success:
            keyframe['action'] = ['gg', "success"]
        else:
            keyframe['action'] = ['gg', "failure"]
        return self.finalize_keyframe(keyframe)

    def eatUp(self, success):
        keyframe = {}
        if success:
            keyframe['action'] = ['ge', "success"]
        else:
            keyframe['action'] = ['ge', "failure"]
        return self.finalize_keyframe(keyframe)

    def putDown(self, success):
        keyframe = {}
        if success:
            keyframe['action'] = ['gp', "success"]
        else:
            keyframe['action'] = ['gp', "failure"]
        return self.finalize_keyframe(keyframe)

    def paintWhite(self, start):
        # msg ["success"|"again"]
        keyframe = {}
        if start:
            keyframe['action'] = ['pw', "success"]
        else:
            keyframe['action'] = ['pw', "again"]
        return self.finalize_keyframe(keyframe)

    def paintBlack(self, start):
        keyframe = {}
        if start:
            keyframe['action'] = ['pb', "success"]
        else:
            keyframe['action'] = ['pb', "again"]
        return self.finalize_keyframe(keyframe)

    def stopPainting(self):
        keyframe = {}
        keyframe['action'] = ['sp', "success"]
        return self.finalize_keyframe(keyframe)

    def flipCoin(self):
        keyframe = {}
        keyframe['action'] = ['fp']
        return self.finalize_keyframe(keyframe)

    def happy(self):
        keyframe = {}
        keyframe['action'] = ['happy']
        return self.finalize_keyframe(keyframe)

    def nonono(self):
        keyframe = {}
        keyframe['action'] = ['nonono']
        return self.finalize_keyframe(keyframe)

    def message(self, message):
        keyframe = {}
        keyframe['action'] = ['sht', message]
        return self.finalize_keyframe(keyframe)

    def error(self, message):
        keyframe = {}
        keyframe['action'] = ['message', message]
        return self.finalize_keyframe(keyframe)

    def boom(self, cmd):
        keyframe = {}
        keyframe['action'] = ['boom', json.dumps(cmd, default=str)]
        return self.finalize_keyframe(keyframe)
