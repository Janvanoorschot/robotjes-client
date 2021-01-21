import os
rootdir = os.path.abspath(os.path.dirname(__file__))

REST_URL = 'http://localhost:8765'
PIKA_URL = 'amqp://guest:guest@localhost:5672/%2F'
LOG_CONFIG_FILE = os.path.join(rootdir, "bin/log.conf")

MONITOR_EXCHANGE = "monitor_exchange"
BUBBLEHUBS_EXCHANGE = 'bubblehubs_exchange'
BUBBLES_EXCHANGE = "bubbles_exchange"
GAMES_EXCHANGE = 'games_exchange'

BUBBLEHUBS_QUEUE = "bubblehub_queue"
BUBBLES_QUEUE = "bubbles_queue"
GAME_STATUS_QUEUE = 'status'

DBASE_USER = "rmprod"
DBASE_PWD = "rmprodsecret"
DBASE_HOST = "localhost"
DBASE_PORT = 5432
DBASE_NAME = "monitor"
