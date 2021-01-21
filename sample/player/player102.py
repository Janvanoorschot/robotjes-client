

def execute(robo):
        while not robo.frontIsObstacle():
            robo.forward()
            robo.right()
