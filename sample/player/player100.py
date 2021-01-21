

def execute(robo):
    for i in range(1):
        while not robo.frontIsObstacle():
            robo.forward()
        robo.right()
        robo.right()
        while not robo.frontIsObstacle():
            robo.forward()
