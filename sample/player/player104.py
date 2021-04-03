from robotjes import Robo

def execute(robo: Robo):

    while not robo.frontIsObstacle():
        robo.forward(1)
        reply = robo.forward(2)
        reply = robo.right()
        reply = robo.forward()
        reply = robo.left()
        reply = robo.forward(2)
        reply = robo.left(2)
        reply = robo.forward(2)
        reply = robo.right()
        reply = robo.forward()
        reply = robo.left()
        reply = robo.forward(2)
        reply = robo.left(2)

