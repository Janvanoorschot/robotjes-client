#!/usr/bin/env python

from pprint import pprint

def execute(robo):

    while True:
        status = robo.right()
        pprint(status)

