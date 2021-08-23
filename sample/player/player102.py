#!/usr/bin/env python

from pprint import pprint

def execute(robo):

    while robo.active():
        status = robo.right()
        # pprint(status)

