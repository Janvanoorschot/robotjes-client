from .status_keeper import StatusKeeper

# fastapi vars
app = None
async_rpc_client = None
async_topic_listener = None

# Current game and the Status of the current Game
current_game = None
status_keeper = None
