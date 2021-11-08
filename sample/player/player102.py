#!/usr/bin/env python

from pprint import pprint

def execute(robo):

    status = robo.forward(4)
    status = robo.left()
    status = robo.forward(5)
    status = robo.right()
    status = robo.forward(5)
    status = robo.pickUp()
    status = robo.stop()

