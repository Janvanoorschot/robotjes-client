#!/usr/bin/env python

from robotjes import Robo
from pprint import pprint


def execute(robo: Robo):

    print("!!!start!!!")
    while robo.active():
        status = robo.forward()
        print("forward")
        if robo.frontIsObstacle():
            break
    print("!!!!!done!!!!")