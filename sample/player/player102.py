#!/usr/bin/env python

from pprint import pprint

def execute(robo):

    while robo.active():
        print("<<<")
        status = robo.right()
        print(">>>")
        # pprint(status)
    print("client script done")

