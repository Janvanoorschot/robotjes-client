from robotjes import Robo


def execute(robo: Robo):

    while True:
        result = robo.forward()
        robo.right()
        robo.forward()
        robo.left()
        robo.forward()
        robo.left()
        robo.left()
        robo.forward()
        robo.right()
        robo.forward()
        robo.left()
        robo.forward()
        robo.left()
        robo.left()

