from .robo import Robo

# inspiration from https://stackoverflow.com/questions/366682/how-to-limit-execution-time-of-a-function-call-in-python
# The goal is to execute a piece of Python code including a timeout.

TIMEOUT = 0.3

import sys
from io import StringIO
import contextlib

import multiprocessing
from time import sleep

def f(time):
    sleep(time)

def exec_on_steroid(queue):
    stdout_old = sys.stdout
    stderr_old = sys.stderr
    redirected_stdout = sys.stdout = StringIO()
    redirected_stderr = sys.stderr = StringIO()
    (object, globals, locals) = queue.get()
    try:
        exec(object, globals, locals)
        queue.put(None) # no exception
    except Exception as e:
        queue.put(e)
    finally:
        sys.stdout = stdout_old
        sys.stderr = stderr_old
        queue.put(redirected_stdout.getvalue())
        queue.put(redirected_stderr.getvalue())
        redirected_stdout.close()
        redirected_stderr.close()


def run_with_limited_time(args, time):
    queue = multiprocessing.Manager().Queue()
    queue.put(args)
    timeout = False
    p = multiprocessing.Process(target=exec_on_steroid, args=(queue,))
    p.start()
    p.join(time)
    if p.is_alive():
        p.terminate()
        timeout = True
        exception = None
        stderr = ""
        stdout = ""
    else:
        timeout = False
        try:
            exception = queue.get(False)
            stderr = queue.get(False)
            stdout = queue.get(False)
        except:
            exception = None
            stderr = ""
            stdout = ""

    return [timeout, exception, stderr, stdout]

class RoboShell(object):

    def __init__(self):
        pass

    def run(self, robo, script_file):
        with open(script_file, 'r') as file:
            data = file.read()
            globalsParameter = {'__builtins__' : None, 'robo': robo, 'print': print, 'range': range, 'quit': quit, 'str': str}
            localsParameter = {}
            (timeout, exception, stderr, stdout) =  run_with_limited_time((data, globalsParameter, localsParameter), TIMEOUT)
            if timeout:
                robo.error(f"program took longer then {TIMEOUT} secconds, failed by time out.")
            if exception:
                robo.error(f"program failed: {exception}")
        if "delete_me_" in script_file:
            import os
            os.unlink(script_file)

