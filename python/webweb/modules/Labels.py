import json

class Labels(dict):

    def __init__(self):
        pass

    def __getattr__(self, name):
        if name not in self.__dict__.keys():
            self.__dict__[name] = Label()

        return self.__dict__[name]

    def to_dict(self):
        labels_dict = { labels_id : labels_vals.to_dict() for labels_id, labels_vals in self.__dict__.items() }
        return labels_dict


class Label(dict):
    def __init__(self):
        self._type = None
        self._value = None
        self._categories = None

        self.valid_labels = ["type", "value", "categories"]

    def write_json(self):
        json_obj = { "{}".format(str(key).replace("_", "")) : val for key, val in self.__dict__.items() if val != None }
        return json_obj

    @property
    def type(self):
        return self._type
    @type.setter
    def type(self, new_type):
        self._type = new_type

    @property
    def value(self):
        return self._value
    @value.setter
    def value(self, new_value):
        self._value = new_value

    @property
    def categories(self):
        return self._categories
    @categories.setter
    def categories(self, new_categories):
        self._categories = new_categories

    def to_dict(self):
        return { "{}".format(str(key).replace("_", "")) : val for key, val in self.__dict__.items() if val != None }

    def __getattr__(self, name):
        return self.__dict__[name]
