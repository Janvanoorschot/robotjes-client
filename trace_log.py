import os
import datetime


class TraceLog(object):

    __instance = None

    def __init__(self, path="/data/dev/robotjes/tracelog"):
        # occurance = str(to_integer(datetime.datetime.now()))
        # self.__path = os.path.join(path, occurance)
        self.__path = path
        if not os.path.isdir(path):
            raise Exception(f"not a tracelog directory: {path}")
        # if os.path.isdir(os.path.join(path, occurance)):
        #     raise Exception(f"tracelog directory already exists: {self.__path}")
        # os.mkdir(self.__path)

    def trace(self, t, *args):
        filename = os.path.join(self.__path, f"{t}.log")
        with open(filename, "a") as f:
            line = str(to_integer(datetime.datetime.now())) + ',' + ','.join([str(x) for x in args]) + '\n'
            f.write(line)

    @staticmethod
    def default_logger():
        if TraceLog.__instance == None:
            TraceLog.__instance = TraceLog()
        return TraceLog.__instance


def to_integer(dt_time: datetime.datetime):
    return dt_time.hour*10000+dt_time.minute*100 + dt_time.second



if __name__ == "__main__":

    TraceLog.default_logger().trace("eikel",4,5,6,[1,2])