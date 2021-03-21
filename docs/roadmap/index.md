# Robotjes-client

## Todo: get development environment going

## Roadmap

* RobotjesEngine
    - FastAPI
    - provides content (robotjesviewer)
    - provides REST calls
      . make moves (for robotjesrunner)
      . give lifeblood (for robotjesrunner)
      . get view-info (for robotjesviewer, using status_keeper)
* RobotjesViewer
    - logic from Robomind Academy (how do we share)
* RoboRunner
    - use the current logic
    - add an optional lifeblook call
    - it should be possible the use breakpoints also stopping the engine

## Design

* fastapi
* no database, no rabbitmq
* same REST api as Robomind Academy
* this evironment does the following:
    - run an engine
    - remembers state so REST calls can be answered (status_keeper)
    - provides view page with movieplayer

## Workflow

* user starts robotjesengine
* robotjesengine starts the engine and the status_keeper
* user starts browser and connects to robotjesengine
* the browser displays robotjesviewer
* user starts developing Solution in robotjesrunner
* user starts robotjesrunner
* robotjesrunner connects to robotjesengine using REST calls.
* user views progress in browser/robotjesviewer
* user stops robotjesrunning using breakpoint,
  which also stops the lifeblood to robotjesengine