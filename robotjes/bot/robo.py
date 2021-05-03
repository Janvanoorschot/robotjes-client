import uuid
import sys


class Robo(object):
    """ Manipulate a Robot using these instructions."""

    OBSERVATIONS = {
        'leftIsClear': ['left', 'clear'],
        'leftIsObstacle': ['left', 'obstacle'],
        'leftIsBeacon': ['left', 'beacon'],
        'leftIsRobo': ['left', 'robot'],
        'leftIsBlack': ['left', 'black'],
        'leftIsWhite': ['left', 'white'],
        'frontIsClear': ['front', 'clear'],
        'frontIsObstacle': ['front', 'obstacle'],
        'frontIsBeacon': ['front', 'beacon'],
        'frontIsRobo': ['front', 'robot'],
        'frontIsBlack': ['front', 'black'],
        'frontIsWhite': ['front', 'white'],
        'rightIsClear': ['right', 'clear'],
        'rightIsObstacle': ['right', 'obstacle'],
        'rightIsBeacon': ['right', 'beacon'],
        'rightIsRobo': ['right', 'robot'],
        'rightIsBlack': ['right', 'black'],
        'rightIsWhite': ['right', 'white']
    }

    def __init__(self, requestor, id=str(uuid.uuid4())):
        self.requestor = requestor
        self.id = id
        self.is_running = True

    def _set_id(self, robo_id):
        self.id = robo_id

    # A result looks like this (at least in run-simulation, still need to do cli_remote_player. cli_local_player)
    # [[6, '06264681-6bac-4a91-9a88-73f70ae1f942', 'right', 2],
    #  ([[True, 0],
    #    [True, 270],
    #    {'dir': 270,
    #     'fog_of_war': {'front': [None, None, None, False],
    #                    'left': [None, None, None, False],
    #                    'right': [None, None, None, False]},
    #     'load': 0,
    #     'pos': (7, 11),
    #     'recording': [[1, 'message', ['starting'], True],
    #                   [2, 'right', [2], True]]c
    #    }
    #   ],
    #  )
    # ]
    def _handle_result(self, result):
        player_result = result[2]
        robo_status = result[1]
        if not player_result['active']:
            self.is_running = False
        return robo_status

    def _handle_boolean_result(self, result):
        if not self.is_running:
            self.stop()
        return result[0]

    def forward(self, steps=1):
        """do a number of steps forward."""
        result = self.requestor.execute([self.id, 'forward', int(steps)])
        return self._handle_result(result)

    def backward(self, steps=1):
        """do a number of steps backward."""
        result = self.requestor.execute([self.id, 'backward', int(steps)])
        return self._handle_result(result)

    def left(self, steps=1):
        """turn left a number steps."""
        result = self.requestor.execute([self.id, 'left', int(steps)])
        return self._handle_result(result)

    def right(self, steps=1):
        """turn right a number steps."""
        result = self.requestor.execute([self.id, 'right', int(steps)])
        return self._handle_result(result)

    def pickUp(self):
        """pick up a beacon that is right in front."""
        result = self.requestor.execute([self.id, 'pickUp'])
        return self._handle_result(result)

    def putDown(self):
        """put down a beacon right in front."""
        result = self.requestor.execute([self.id, 'putDown'])
        return self._handle_result(result)

    def eatUp(self):
        """pick up a beacon that is right in front and eat/destroy it."""
        result = self.requestor.execute([self.id, 'eatUp'])
        return self._handle_result(result)

    def paintWhite(self):
        """start painting white."""
        result = self.requestor.execute([self.id, 'paintWhite'])
        return self._handle_result(result)

    def paintBlack(self):
        """start painting black."""
        result = self.requestor.execute([self.id, 'paintBlack'])
        return self._handle_result(result)

    def stopPainting(self):
        """stop painting."""
        result = self.requestor.execute([self.id, 'stopPainting'])
        return self._handle_result(result)

    def leftIsClear(self):
        """test if the position to the left is clear."""
        result = self.requestor.execute([self.id, 'leftIsClear'])
        return self._handle_boolean_result(result)

    def leftIsObstacle(self):
        """test if the position to the left is not clear."""
        result = self.requestor.execute([self.id, 'leftIsObstacle'])
        return self._handle_boolean_result(result)

    def leftIsBeacon(self):
        """test if the position to the left contains a beacon."""
        result = self.requestor.execute([self.id, 'leftIsBeacon'])
        return self._handle_boolean_result(result)

    def leftIsRobot(self):
        """test if the position to the left contains a robot."""
        result = self.requestor.execute([self.id, 'leftIsRobot'])
        return self._handle_boolean_result(result)

    def leftIsWhite(self):
        """test if the position to the left is painted white."""
        result = self.requestor.execute([self.id, 'leftIsWhite'])
        return self._handle_boolean_result(result)

    def leftIsBlack(self):
        """test if the position to the left is painted black."""
        result = self.requestor.execute([self.id, 'leftIsBlack'])
        return self._handle_boolean_result(result)

    def frontIsClear(self):
        """test if the position in front is clear."""
        result = self.requestor.execute([self.id, 'frontIsClear'])
        return self._handle_boolean_result(result)

    def frontIsObstacle(self):
        """test if the position in front is not clear."""
        result = self.requestor.execute([self.id, 'frontIsObstacle'])
        return self._handle_boolean_result(result)

    def frontIsBeacon(self):
        """test if the position in front contains a beacon."""
        result = self.requestor.execute([self.id, 'frontIsBeacon'])
        return self._handle_boolean_result(result)

    def frontIsRobot(self):
        """test if the position in front contains a robot."""
        result = self.requestor.execute([self.id, 'frontIsRobot'])
        return self._handle_boolean_result(result)

    def frontIsWhite(self):
        """test if the position in front is painted white."""
        result = self.requestor.execute([self.id, 'frontIsWhite'])
        return self._handle_boolean_result(result)

    def frontIsBlack(self):
        """test if the position in front is painted black."""
        result = self.requestor.execute([self.id, 'frontIsBlack'])
        return self._handle_boolean_result(result)

    def rightIsClear(self):
        result = self.requestor.execute([self.id, 'rightIsClear'])
        return self._handle_boolean_result(result)

    def rightIsObstacle(self):
        result = self.requestor.execute([self.id, 'rightIsObstacle'])
        return self._handle_boolean_result(result)

    def rightIsBeacon(self):
        result = self.requestor.execute([self.id, 'rightIsBeacon'])
        return self._handle_boolean_result(result)

    def rightIsRobot(self):
        result = self.requestor.execute([self.id, 'rightIsRobot'])
        return self._handle_boolean_result(result)

    def rightIsWhite(self):
        result = self.requestor.execute([self.id, 'rightIsWhite'])
        return self._handle_boolean_result(result)

    def rightIsBlack(self):
        result = self.requestor.execute([self.id, 'rightIsBlack'])
        return self._handle_boolean_result(result)

    def message(self, message):
        self.requestor.execute([self.id, 'message', message])

    def error(self, message):
        self.requestor.execute([self.id, 'error', message])

    def stop(self):
        # self.requestor.execute([])
        sys.exit("robo break")

    def active(self):
        return self.is_running

    @staticmethod
    def is_observation(cmd):
        return cmd and isinstance(cmd, list) and len(cmd) >= 3 and cmd[2] in Robo.OBSERVATIONS

    @staticmethod
    def observation(status, cmd):
        (selector, type) = Robo.OBSERVATIONS[cmd[2]]
        if status and selector in status['fog_of_war']:
            lst = status['fog_of_war'][selector]
            # lst -> [tile, paint, robot, beacon]
            #     ->  None|t, None|p, None|id, None|True]
            if type == 'clear':
                return lst[0] is None and lst[2] is None and lst[3] is None
            elif type == 'obstacle':
                return lst[0] is not None or lst[2] is not None or lst[3] is not None
            elif type == 'beacon':
                return lst[3] is not None
            elif type == 'robot':
                return lst[2] is not None
            elif type == 'black':
                return lst[1] == 'black'
            elif type == 'white':
                return lst[1] == 'white'
            else:
                raise Exception(f"illegal status type{type}")
        else:
            return False

