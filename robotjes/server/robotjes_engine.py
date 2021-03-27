class RobotjesEngine(object):

    def __init__(self, status_keeper):
        self.status_keeper = status_keeper

    def isRunning(self):
        return False

    def start(self):
        # start the current game
        pass

    def stop(self):
        # stop the currently running game and create a new one in the 'created' (not 'running') state
        pass

    def timer(self, now):
        pass

