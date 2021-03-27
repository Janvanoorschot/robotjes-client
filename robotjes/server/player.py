class Player:

    def __init__(self, player_id, player_name):
        self.player_id = player_id
        self.player_name = player_name
        self.robos = []

    def get_status(self, game):
        result = {}
        result["player_id"] = self.player_id
        result["player_name"] = self.player_name
        result["robos"] = {}
        for robo_id in self.robos:
            result["robos"][robo_id] = game.get_status(robo_id)
        return result


