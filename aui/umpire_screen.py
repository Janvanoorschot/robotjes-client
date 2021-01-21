from asciimatics.scene import Scene
from asciimatics.screen import Screen
from asciimatics.widgets import Frame, Text, Layout
import json


class UmpireDisplay:
    # controller object
    def __init__(self):
        self.model = UmpireModel()
        self.view = UmpireScreen(self.model)

    def close(self):
        self.view.close()

    def has_key(self):
        return self.view.has_key

    def timer(self):
        if self.view.screen.has_resized():
            self.view.close()
            self.view = UmpireScreen(self.model)
        self.view.timer()

    def game_started(self, game_id, game_name):
        self.model.game_started(game_id, game_name)


    def player_registered(self, player_id, player_name):
        pass


    def player_deregistered(self, player_id):
        pass

    def game_status(self, game_tick, game_status):
        self.model.set_game_status(game_tick, game_status)
        self.view.update(game_tick, 'game')

    def player_status(self, game_tick, player_status):
        self.model.set_player_status(game_tick, player_status)
        if self.model.players_updated():
            self.view.close()
            self.view = UmpireScreen(self.model)
        else:
            self.view.update(game_tick, 'player')



class UmpireModel:
    # model object
    def __init__(self):
        self.game_id = None
        self.game_name = None
        self.game_tick = -1
        self.cur_game_status = {}
        self.prev_player_status = {}
        self.cur_player_status = {}
        self.cur_robo_status = {}
        self.history = {}

    def game_started(self, game_id, game_name):
        self.game_id = game_id
        self.game_name = game_name

    #   'status': {
    #     'game_tick': 405,
    #     'isStarted': True,
    #     'isStopped': False,
    #     'isSuccess': True
    #   }
    def set_game_status(self, game_tick, game_status):
        self.game_tick = game_tick
        self.cur_game_status = game_status

    # {
    #   '4f290bc5-cc43-4b4b-9b85-66d5396bf921': {
    #       'player_id': '4f290bc5-cc43-4b4b-9b85-66d5396bf921',
    #       'player_name': 'me',
    #       'robos': {
    #           '43f5eaf0-110d-448b-9ab5-aaa62914f67b':
    #               {
    #                   'pos': [8, 11],
    #                   'load': 0,
    #                   'dir': 270,
    #                   'recording': [
    #                       [32, 'left', [1], True],
    #                       [33, 'left', [1], True],
    #                       [34, 'forward', [1], True]
    #                   ],
    #                   'fog_of_war': {
    #                       'left': [None, None, None, False],
    #                       'front': [None, None, None, False],
    #                       'right': [None, None, None, False]
    #                   }
    #               }
    #           }
    #       }
    # }
    def set_player_status(self, game_tick, player_status):
        self.game_tick = game_tick
        self.prev_player_status = self.cur_player_status
        self.cur_player_status = player_status
        # feed the history
        for player_id, player in player_status.items():
            if player_id not in self.history:
                self.history[player_id] = {}
            for robo_id, robo in player['robos'].items():
                if robo_id not in self.history[player_id]:
                    self.history[player_id][robo_id] = []
                history = self.history[player_id][robo_id]
                if len(history) < 8:
                    if robo:
                        history.append(f"{robo['pos']}/{robo['dir']}")
                    # history.pop(0)

    def players_updated(self):
        if len(self.prev_player_status) == 0 and len(self.cur_player_status) == 0:
            return False
        if len(self.prev_player_status) != len(self.cur_player_status):
            return True
        for player_id, player in self.cur_player_status.items():
            if player_id not in self.prev_player_status:
                return True
            robos = player['robos']
            if len(self.prev_player_status[player_id]['robos']) != len(robos):
                return True
            for robo_id, robo in robos.items():
                if robo_id not in self.prev_player_status[player_id]['robos']:
                    return True
        return False


class UmpireScreen:
    # main screen/view/windows object
    def __init__(self, model):
        self.model = model
        self.last_event = None
        self.has_key = False
        Screen.wrapper(self.populate, catch_interrupt=True)

    def populate(self, screen):
        self.screen = screen
        self.game_view = GameView(self.screen, self.model)
        self.player_view = PlayerView(self.screen, self.model)
        self.scenes = []
        self.effects = [
            self.game_view,
            self.player_view
        ]
        self.scenes.append(Scene(self.effects, -1))
        self.screen.set_scenes(self.scenes)

    def update(self, game_tick, type, *args):
        if type == 'game':
            self.game_view.upd(args)
        elif type == 'player':
            self.player_view.upd(args)
        else:
            pass

    def close(self):
        self.screen.close()

    def timer(self):
        self.last_event = self.screen.get_event()
        if not self.has_key and self.last_event:
            self.has_key = True
        self.screen.draw_next_frame()


class GameView(Frame):

    def __init__(self, screen, model):
        super(GameView, self).__init__(screen,
                                       screen.height * 1 // 2,
                                       screen.width * 1 // 3,
                                       x=0,
                                       y=0,
                                       on_load=self.upd,
                                       title="Game",
                                       name="Game")
        self.model = model
        self.gameid_field = Text("", "gameid")
        self.gamename_field = Text("", "gamename")
        self.gametick_field = Text("", "gametick")
        layout = Layout([4,1,1], fill_frame=True)
        self.add_layout(layout)
        layout.add_widget(self.gameid_field, 0)
        layout.add_widget(self.gamename_field, 1)
        layout.add_widget(self.gametick_field, 2)
        self.set_theme('monochrome')
        self.fix()

    def upd(self, *args):
        if self.model.cur_game_status:
            self.gameid_field.value = self.model.game_id
            self.gamename_field.value = self.model.game_name
            self.gametick_field.value = str(self.model.cur_game_status['game_tick'])


class PlayerView(Frame):

    def __init__(self, screen, model):
        super(PlayerView, self).__init__(screen,
                                       screen.height * 1 // 2,
                                       screen.width * 2 // 3,
                                       x=screen.width//3,
                                       y=0,
                                       on_load=self.upd,
                                       hover_focus=True,
                                       title="Player")
        self.model = model
        self.cur_data = {}
        self.populate()
        self.set_theme('monochrome')
        self.fix()

    def populate(self):
        if self.model.cur_player_status:
            for player_id, player in self.model.cur_player_status.items():
                player_name = f"player_{player_id}"
                player_layout = Layout([1, 1, 1], fill_frame=True)
                self.add_layout(player_layout)
                player_layout.add_widget(Text(label="Player:", name=player_name))
                robo_ix = 0
                for robo_id, robo in player['robos'].items():
                    robo_name = f"robo_{robo_ix}"
                    robo_details = f"robo_details_{robo_ix}"
                    robo_recording = f"robo_recording_{robo_ix}"
                    robo_history = f"robo_history_{robo_ix}"
                    robo_ix = robo_ix + 1
                    robo_layout1 = Layout([2, 2, 6])
                    robo_layout2 = Layout([2, 8])
                    robo_layout3 = Layout([2, 8])
                    self.add_layout(robo_layout1)
                    self.add_layout(robo_layout2)
                    self.add_layout(robo_layout3)
                    robo_layout1.add_widget(Text(label="Robo:", name=robo_name), 0)
                    robo_layout1.add_widget(Text(name=robo_details), 1)
                    robo_layout2.add_widget(Text(name=robo_recording), 1)
                    robo_layout3.add_widget(Text(name=robo_history), 1)
        else:
            dummy_layout = Layout([1])
            self.add_layout(dummy_layout)
            dummy_layout.add_widget(Text(label="Player:", name="dummy"))

    def upd(self, *args):
        if self.model.cur_player_status:
            self.cur_data = {}
            for player_id, player in self.model.cur_player_status.items():
                player_name = f"player_{player_id}"
                self.cur_data[player_name] = player['player_name']
                robo_ix = 0
                for robo_id, robo in player['robos'].items():
                    robo_name = f"robo_{robo_ix}"
                    robo_details = f"robo_details_{robo_ix}"
                    robo_recording = f"robo_recording_{robo_ix}"
                    robo_history = f"robo_history_{robo_ix}"
                    self.cur_data[robo_name] = robo_name
                    self.cur_data[robo_details] = f"pos[{str(robo['pos'])}]"
                    self.cur_data[robo_recording] = json.dumps(robo['recording'])
                    self.cur_data[robo_history] = ""
                    if player_id in self.model.history:
                        if robo_id in self.model.history[player_id]:
                            self.cur_data[robo_history] = json.dumps(self.model.history[player_id][robo_id])
            self.data = self.cur_data
        else:
            self.data = {"dummy": "empty"}
