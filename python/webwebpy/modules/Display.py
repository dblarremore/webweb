try:
    from webweb.modules.Labels import Labels
except:
    from modules.Labels import Labels

class Display(dict):

    def __init__(self, num_nodes=100):
        self.N = num_nodes
        self.name = None
        self._w = None
        self._h = None
        self._l = None
        self._r = None
        self._c = None
        self._g = None
        self.nodeNames = None
        self.labels = Labels()

    def to_dict(self):
        json_obj = {}
        for key, val in self.__dict__.items():
            if val == None:
                continue

            new_key = "{}".format(str(key).replace("_", ""))
            new_val = val.to_dict() if key == "labels" else val

            json_obj[new_key] = new_val
        return json_obj

    @property
    def w(self):
        return self._w
    @w.setter
    def w(self, val):
        MIN_VAL = 0
        MAX_VAL = 2000
        if MIN_VAL < val <= MAX_VAL:
            self._w = val
        else:
            raise ValueError('Invalid value for w. Value must be between {} and {}.'.format(MIN_VAL, MAX_VAL))

    @property
    def h(self):
        return self._h
    @h.setter
    def h(self, val):
        MIN_VAL = 0
        MAX_VAL = 2000
        if MIN_VAL < val <= MAX_VAL:
            self._h = val
        else:
            raise ValueError('Invalid value for h. Value must be between {} and {}.'.format(MIN_VAL, MAX_VAL))

    @property
    def l(self):
        return self._l
    @l.setter
    def l(self, val):
        MIN_VAL = 0
        MAX_VAL = 100
        if MIN_VAL < val <= MAX_VAL:
            self._l = val
        else:
            raise ValueError('Invalid value for l. Value must be between {} and {}.'.format(MIN_VAL, MAX_VAL))

    @property
    def r(self):
        return self._r
    @r.setter
    def r(self, val):
        MIN_VAL = 0
        MAX_VAL = 100
        if MIN_VAL < val <= MAX_VAL:
            self._r = val
        else:
            raise ValueError('Invalid value for r. Value must be between {} and {}.'.format(MIN_VAL, MAX_VAL))

    @property
    def c(self):
        return self._c
    @c.setter
    def c(self, val):
        MIN_VAL = 0
        MAX_VAL = 100
        if MIN_VAL < val <= MAX_VAL:
            self._c = val
        else:
            raise ValueError('Invalid value for c. Value must be between {} and {}.'.format(MIN_VAL, MAX_VAL))

    @property
    def g(self):
        return self._g
    @g.setter
    def g(self, val):
        MIN_VAL = 0
        MAX_VAL = 100
        if MIN_VAL < val <= MAX_VAL:
            self._g = val
        else:
            raise ValueError('Invalid value for g. Value must be between {} and {}.'.format(MIN_VAL, MAX_VAL))

    def __getattr__(self, name):
        return self.__dict__[name]
