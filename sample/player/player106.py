from robotjes.bot import Robo


def execute(robo: Robo):

    while True:
        for i in range(4):
            robo.forward(2)
            robo.right()
