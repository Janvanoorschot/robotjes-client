#!/usr/bin/env python

from pprint import pprint

def execute(robo):

    while robo.active():
        robo.right()
        robo.forward()
        robo.backward()

    robo.stop()

