import sys
from io import StringIO


def exec_on_steroid(object, globals, locals):
    stdout_old = sys.stdout
    stderr_old = sys.stderr
    # redirected_stdout = sys.stdout = StringIO()
    # redirected_stderr = sys.stderr = StringIO()
    try:
        exec(object, globals, locals)
        return True
    except Exception as e:
        return False
    finally:
        sys.stdout = stdout_old
        sys.stderr = stderr_old
        # redirected_stdout.close()
        # redirected_stderr.close()

class RoboThread():

    def __init__(self, robo, execute):
        self.robo = robo
        self.execute = execute

    def run(self):
        self.execute(self.robo)
        self.robo.stop()

    def run_old(self):
        with open(self.script_file, 'r') as file:
            data = file.read()
            globals = {'robo': self.robo}
            locals = {}
            return exec_on_steroid(data, globals, locals)
        if "delete_me_" in script_file:
            import os
            os.unlink(script_file)
