from asciimatics.scene import Scene
from asciimatics.screen import Screen
from asciimatics.widgets import Frame, Text, Layout

class PlayerDisplay:
    # controller object
    def __init__(self, headerline):
        self.model = PlayerModel(headerline)
        self.view = PlayerScreen(self.model)

    def close(self):
        self.view.close()

    def has_key(self):
        return self.view.has_key

    def timer(self):
        if self.view.screen.has_resized():
            self.view.close()
            self.view = PlayerScreen(self.model)
        self.view.timer()

    def create_robo(self, game_tick, robo_id):
        pass

    def robo_status(self, game_tick, robo_id, robo_status):
        self.model.set_robo_status(game_tick, robo_id, robo_status)
        self.view.update(game_tick, 'robo', robo_id)

    def issue_command(self, game_tick, robo_id, cmd, reply):
        pass


class PlayerModel:
    # model object
    def __init__(self, headerline):
        self.headerline = headerline
        self.game_tick = -1
        self.cur_robo_status = {}

    # {
    #    'pos': [7, 11],
    #    'load': 0,
    #    'dir': 180,
    #    'recording': [
    #      [304, 'forward', [1], True],
    #      [305, 'right', [1], True],
    #      [306, 'forward', [1], True]],
    #    'fog_of_war': {
    #      'left': [None, None, None, False],
    #      'front': [None, None, None, False],
    #      'right': [None, None, None, False]
    #    }
    # }
    def set_robo_status(self, game_tick, robo_id, robo_status):
        self.game_tick = game_tick
        self.cur_robo_status[robo_id] = robo_status


class PlayerScreen:
    # main screen/view/windows object
    def __init__(self, model):
        self.model = model
        self.last_event = None
        self.has_key = False
        Screen.wrapper(self.populate, catch_interrupt=True)

    def populate(self, screen):
        self.screen = screen
        self.robo_view = RoboView(self.screen, self.model)
        self.scenes = []
        self.effects = [
            self.robo_view
        ]
        self.scenes.append(Scene(self.effects, -1))
        self.screen.set_scenes(self.scenes)

    def update(self, game_tick, type, *args):
        if type == 'robo':
            self.robo_view.upd(args)
        else:
            pass

    def close(self):
        self.screen.close()

    def timer(self):
        self.last_event = self.screen.get_event()
        if not self.has_key and self.last_event:
            self.has_key = True
        self.screen.draw_next_frame()


class RoboView(Frame):

    def __init__(self, screen, model):
        super(RoboView, self).__init__(screen,
                                       screen.height * 1 // 3,
                                       screen.width,
                                       x=0,
                                       y=screen.height * 1 // 3,
                                       on_load=self.upd,
                                       hover_focus=False,
                                       title="Robos")
        self.model = model
        self.position_field = Text("", "position")
        self.dir_field = Text("", "direction")
        self.load_field = Text("", "load")
        layout = Layout([1, 1, 1], fill_frame=True)
        self.add_layout(layout)
        layout.add_widget(self.position_field, 0)
        layout.add_widget(self.dir_field, 1)
        layout.add_widget(self.load_field, 2)
        self.set_theme('monochrome')
        self.fix()

    def upd(self, *args):
        if self.model.cur_robo_status and len(args)>0 and len(args[0])>0:
            robo_id = args[0][0]
            robo_status = self.model.cur_robo_status
            if robo_id in robo_status and len(robo_status[robo_id])>0:
                self.position_field.value = str(self.model.cur_robo_status[robo_id]['pos'])
                self.dir_field.value = str(self.model.cur_robo_status[robo_id]['dir'])
                self.load_field.value = str(self.model.cur_robo_status[robo_id]['load'])


