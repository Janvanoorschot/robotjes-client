from . import ROBO_SEMANTICS, ROBO_LANGUAGE


class Success:

    def __init__(self, engine, validationCheckMap, hintRulesMap):
        self.engine = engine
        self.validationCheckMap = validationCheckMap
        self.hintRulesMap = hintRulesMap
        self.success = True
        self.hint = None

    @staticmethod
    def from_json(json, engine):
        validationCheck = {}
        hintRules = {}
        if json and 'validationCheck' in json:
            validationCheck = json['validationCheck']
        if json and 'hintRules' in json:
            hintRules = json['hintRules']
        return Success(engine, validationCheck, hintRules)

    def beforeRun(self):
        # for the time being, we do not support 'before run' analysis
        pass

    def afterRun(self):
        # first calculate success by looking at 'postRunUsage', 'postRunWorld', 'postRunProgram' (why so many Arvid?)
        for key,value in self.validationCheckMap.items():
            if key == 'postRunUsage' or key == 'postRunWorld':
                parseResult = ROBO_LANGUAGE.parseString(value)
                expr = parseResult[0]
                result = expr.eval(self.engine.world, ROBO_SEMANTICS)
                if not result:
                    self.success = False
                    break
        # next calculate if a (and which) hint can be given in case of failure
        if not self.success:
            for item in self.hintRulesMap:
                premise = item["premise"]
                parseResult = ROBO_LANGUAGE.parseString(premise)
                expr = parseResult[0]
                result = expr.eval(self.engine.world, ROBO_SEMANTICS)
                if result:
                    self.hint = item
                    self.hint["x"] = -1
                    self.hint["y"] = -1
                    break

    def isSuccess(self):
        return self.success

    def getHint(self):
        return self.hint
