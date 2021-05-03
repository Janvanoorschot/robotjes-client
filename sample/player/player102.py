

def execute(robo):

    while not robo.frontIsObstacle():
        robo.forward()
    robo.left()
    while True:
        if robo.frontIsBeacon():
            robo.pickUp()
        if robo.frontIsObstacle():
            robo.left()
        else:
            if robo.rightIsObstacle():
                robo.forward()
            else:
                robo.right()

