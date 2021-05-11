

def execute(robo):

    while not robo.frontIsObstacle():
        robo.forward()
    robo.left()
    while not robo.frontIsObstacle():
        robo.forward()
    robo.right()
    while True:
        if robo.frontIsBeacon():
            robo.eatUp()
        if robo.frontIsObstacle():
            robo.left()
        else:
            if robo.leftIsObstacle():
                robo.forward()
            else:
                robo.right()
                robo.forward()

