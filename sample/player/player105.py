from robotjes.bot import Robo


def execute(robo: Robo):
    while robo.active():
        robo.forward()
