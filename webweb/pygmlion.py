# reference:
# https://www.fim.uni-passau.de/fileadmin/files/lehrstuhl/brandenburg/projekte/gml/gml-technical-report.pdf

################################################################################
#
#
#
#
#
#
#                                   Interface
#
#
#
#
#
#
################################################################################
def get_gml(filename, validate=True):
    """returns a dictified representation of some gml

    note: comments are removed

    parameters:
    - filename: string. path of file
    - validate: boolean. default is True. If true, will check that ids are
    unduplicated and that edges have `source` and `target` attributes

    format:
    {
        'Creator' : 'some_creator',
        'directed' : 1,
        'graph' : [
            {
                'some_attribute' : 'some_value',
                'node' : [
                    {
                        'id' : 1,
                        ...
                    },
                    ...
                ]
                'edge' : [
                    {
                        'source' : 1,
                        'target' : 2,
                        ...
                    },
                    ...
                ]
            }
        ]
        
    }
    """
    content = get_raw_gml(filename, validate)
    formatted = format_gml_dict(content)
    return formatted

def get_raw_gml(filename, validate=True):
    with open(filename, 'r') as f:
        lines = [l.strip() for l in f.readlines()]

    parsed = []
    while lines:
        attribute, lines = parse_lines(lines)
        if attribute:
            parsed.append(attribute)

    formatted = format_parsed_content(parsed, validate)

    return formatted

def write_gml(content, filename):
    if type(content) == dict:
        content = convert_gml_dict_to_tuple_list(content)
    
    to_write = [create_element(k, v).write() for k, v in content]

    with open(filename, 'w') as f:
        f.write("\n".join(to_write) + "\n")
################################################################################
#
#
#
#
#
#
#                                   Utils
#
#
#
#
#
#
################################################################################
def format_gml_dict(value):
    formatted = {}
    if type(value) == list:
        for key, subvalue in value:
            if key == 'comment':
                continue
            
            if type(subvalue) != list:
                formatted[key] = subvalue
            else:
                if not formatted.get(key):
                    formatted[key] = []

                formatted[key].append(format_gml_dict(subvalue))


    return formatted

def convert_gml_dict_to_tuple_list(content):
    graph_data = content.pop('graph', None)
    converted = to_tuple_list(content)

    if graph_data:
        for graph in graph_data:
            nodes = [('node', to_tuple_list(n)) for n in graph.pop('node', [])]
            edges = [('edge', to_tuple_list(e)) for e in graph.pop('edge', [])]

            converted_graph = to_tuple_list(graph)

            converted_graph += nodes
            converted_graph += edges

            if converted_graph:
                converted.append(('graph', converted_graph))

    return converted

def to_tuple_list(item):
    converted = []
    for key, value in item.items():
        if type(value) == dict:
            converted.append((key, to_tuple_list(value)))
        elif type(value) == list:
            for subvalue in value:
                converted.append((key, to_tuple_list(subvalue)))
        else:
            converted.append((key, value))

    return converted

def create_element(key, value):
    if type(value) is str:
        if value.startswith('#'):
            return LineComment(value=value)
        else:
            return StringAttribute(key=key, value=value)
    elif type(value) is int:
        return IntegerAttribute(key=key, value=value)
    elif type(value) is float:
        return FloatAttribute(key=key, value=value)
    elif type(value) is list:
        return ListAttribute(
            key=key,
            value=[ create_element(k, v) for k, v in value]
        )

################################################################################
#
#
#
#
#
#
#                           Generic Attribute Types
#
#
#
#
#
#
################################################################################
class GenericAttribute(object):
    def __init__(self, lines=[], key='', value=''):
        self.key = key
        self.value = value
        self.lines = lines
        self.line = lines[0] if len(lines) else ""
        self.unconsumed = lines[1:] if len(self.lines) > 1 else []

    def __repr__(self):
        return self.__str__()

class LineComment(GenericAttribute):
    def __init__(self, lines=[], key='comment', value=''):
        super().__init__(lines=lines, key=key, value=value)

    def read(self):
        self.value = self.line

    def is_type(self, lines):
        return lines[0].startswith('#')

    def __str__(self):
        return "{}".format(self.write())

    def write(self):
        return '{}'.format(self.value)


class KeyValueAttribute(GenericAttribute):
    kind = 'Generic'

    def __init__(self, lines=[], key='', value=''):
        self.lines = lines
        self.key = key
        self.value = value
        self.line = lines[0] if len(lines) else ""
        self.unconsumed = lines[1:] if len(self.lines) > 1 else []

    def __str__(self):
        """
        >>> str(KeyValueAttribute(key='test', value='passes'))
        'test passes (Generic)'
        """
        return "{content} ({kind})".format(kind=self.kind, content=self.write())

    def write(self):
        """
        writes a key value attribute
        >>> KeyValueAttribute(key='test', value='passes').write()
        'test passes'
        """
        return '{key} {value}'.format(key=self.key, value=self.value)

    def typecast_value(self, value):
        """
        >>> KeyValueAttribute().typecast_value(1)
        1
        """
        return value

    def is_type(self, lines):
        """
        >>> KeyValueAttribute().is_type(["key value"])
        True
        >>> KeyValueAttribute().is_type(["key"])
        False
        """
        return lines[0].count(' ') > 0

    def get_value_and_unconsumed(self, value):
        """
        generic function to strip off content that is not being consumed;

        only consume the minimal amount of content; if there's unconsumed
        content, return it

        >>> KeyValueAttribute().get_value_and_unconsumed("value")
        ('value', '')
        >>> KeyValueAttribute().get_value_and_unconsumed("value extra stuff")
        ('value', 'extra stuff')
        """
        unconsumed = ''
        if ' ' in value:
            value, unconsumed = value.split(' ', 1)

        return value, unconsumed

    def read(self):
        """
        >>> _ = KeyValueAttribute(lines=['key value', 'key2 value2'])
        >>> _.read()
        >>> _.key
        'key'
        >>> _.value
        'value'
        >>> _.unconsumed
        ['key2 value2']
        >>> _ = KeyValueAttribute(lines=['key value key2 value2', 'key3 value3'])
        >>> _.read()
        >>> _.unconsumed
        ['key2 value2', 'key3 value3']
        """
        self.key, value = self.line.split(' ', 1)

        value, unconsumed = self.get_value_and_unconsumed(value)

        self.value = self.typecast_value(value)

        if unconsumed:
            self.unconsumed = [unconsumed.strip()] + self.unconsumed

class StringAttribute(KeyValueAttribute):
    """A key/value pair where the value is a quoted string."""
    kind = 'String'

    def typecast_value(self, value):
        """
        >>> StringAttribute().typecast_value(1)
        '1'
        """
        return str(value)

    def is_type(self, lines):
        """
        >>> StringAttribute().is_type(['key'])
        False
        >>> StringAttribute().is_type(['key "value'])
        False
        >>> StringAttribute().is_type(['key value "value"'])
        False
        >>> StringAttribute().is_type(['key "value"'])
        True
        >>> StringAttribute().is_type(['key "value" key2 value2'])
        True
        """
        line = lines[0]
        if not super().is_type(lines):
            return False

        _, value = line.split(' ', 1)

        if value[0] != '"':
            return False
        
        try:
            self.get_value_and_unconsumed(value)
            return True
        except:
            return False

    def get_value_and_unconsumed(self, value):
        """
        >>> StringAttribute().get_value_and_unconsumed('"value value"')
        ('value value', '')
        >>> StringAttribute().get_value_and_unconsumed('"value value" unconsumed')
        ('value value', 'unconsumed')
        """
        _, value, unconsumed = value.split('"', 2)
        unconsumed = unconsumed.strip()
        return value, unconsumed

    def write(self):
        """
        writes a key value attribute

        >>> StringAttribute(key='test', value='passes').write()
        'test "passes"'
        """
        return '{key} "{value}"'.format(key=self.key, value=self.value).rstrip()

class IntegerAttribute(KeyValueAttribute):
    """A key/value pair where the value is an unquoted signed integer."""
    kind = 'Integer'

    def typecast_value(self, value):
        """
        >>> IntegerAttribute().typecast_value(1)
        1
        """
        return int(value)

    def is_type(self, lines):
        """
        >>> IntegerAttribute().is_type(['key'])
        False
        >>> IntegerAttribute().is_type(['key "value"'])
        False
        >>> IntegerAttribute().is_type(['key 1.0'])
        False
        >>> IntegerAttribute().is_type(['key 1'])
        True
        >>> IntegerAttribute().is_type(['key 1 key2 value2'])
        True
        """
        line = lines[0]
        if not super().is_type(lines):
            return False

        _, value = line.split(' ', 1)

        if value.count(' '):
            value, _ = value.split(' ', 1)

        if not value.isdigit():
            return False

        return True

class FloatAttribute(KeyValueAttribute):
    """A key/value pair where the value is an unquoted signed real number in
    double precision."""
    kind = 'Float'

    def typecast_value(self,value):
        """
        >>> FloatAttribute().typecast_value(1)
        1.0
        """
        return float(value)

    def is_type(self, lines):
        """
        >>> FloatAttribute().is_type(['key'])
        False
        >>> FloatAttribute().is_type(['key "value"'])
        False
        >>> FloatAttribute().is_type(['key 1.0'])
        True
        >>> FloatAttribute().is_type(['key 1'])
        True
        >>> FloatAttribute().is_type(['key 1.0 key2 value2'])
        True
        """
        line = lines[0]
        if not super().is_type(lines):
            return False

        _, value = line.split(' ', 1)

        if value.count(' '):
            value, _ = value.split(' ', 1)

        value_copy = value
        if '.' in value:
            if value.count('.') is 1:
                value_copy = value.replace('.', '')
            else:
                return False

        if not value_copy.isdigit():
            return False

        return True

class ListAttribute(GenericAttribute):
    kind = 'List'

    def __init__(self, lines=[], key='', value='', open_delimiter='[', close_delimiter=']'):
        super().__init__(lines=lines, key=key, value=value)
        self.open_delimiter = open_delimiter
        self.close_delimiter = close_delimiter

    def read(self):
        """
        >>> _ = ListAttribute(lines=['graph <'], open_delimiter='<', close_delimiter='>')
        >>> _.read()
        >>> _.key
        'graph'
        >>> _.lines
        []
        >>> _.value
        []
        >>> _.unconsumed
        []
        >>> _ = ListAttribute(lines=['graph', '< key "value" >'], open_delimiter='<', close_delimiter='>')
        >>> _.read()
        >>> _.key
        'graph'
        >>> _.lines
        ['key "value" >']
        >>> _.value[0].value
        'value'
        >>> _.value[0].key
        'key'
        >>> _.unconsumed
        []
        >>> _ = ListAttribute(lines=['graph', '<> key "value"'], open_delimiter='<', close_delimiter='>')
        >>> _.read()
        >>> _.value
        []
        >>> _.unconsumed
        ['key "value"']
        """
        self.key = self.get_key(self.lines[0])

        self.lines = self.open_context(self.lines)

        value = []
        unconsumed = self.lines

        if self.lines:
            while not self.should_close_context(unconsumed):
                subvalue, unconsumed = self.parse_attribute(unconsumed)

                if subvalue:
                    value.append(subvalue)

            self.close_context(unconsumed)


        self.value = value
        self.unconsumed = unconsumed

    def get_key(self, line):
        """
        >>> ListAttribute().get_key('key')
        'key'
        >>> ListAttribute().get_key('key value')
        'key'
        """
        key = line

        if key.count(' '):
            key, _ = key.split(' ', 1)

        return key

    def open_context(self, lines):
        """
        >>> ListAttribute(open_delimiter='|').open_context(lines=['key', '|'])
        []
        >>> ListAttribute(open_delimiter='|').open_context(lines=['key', '| extra'])
        ['extra']
        >>> ListAttribute(open_delimiter='|').open_context(lines=['key', 'extra'])
        Traceback (most recent call last):
        ...
        ListParseError
        """
        line = lines.pop(0)

        if self.open_delimiter not in line:
            if lines and self.open_delimiter in lines[0]:
                line = lines.pop(0)
            else:
                raise ListParseError
        
        _, remaining = line.split(self.open_delimiter, 1)

        remaining = remaining.strip()

        if remaining:
            lines = [remaining] + lines

        return lines

    def should_close_context(self, lines, delimiter=']'):
        """
        >>> ListAttribute(close_delimiter='|').should_close_context(['| hello'])
        True
        >>> ListAttribute(close_delimiter='|').should_close_context(['hello'])
        False
        """
        if lines:
            return lines[0].startswith(self.close_delimiter)
        else:
            return False

    def close_context(self, lines):
        """
        >>> ListAttribute().close_context(['| hello', 'yes'])
        ['hello', 'yes']
        >>> ListAttribute().close_context(['hello', 'yes'])
        ['yes']
        """
        if lines[0].count(' '):
            _, lines[0] = lines[0].split(' ', 1)
        else:
            lines.pop(0)

        return lines

    def is_type(self, lines, delimiter='['):
        """
        >>> ListAttribute().is_type(['1'])
        False
        >>> ListAttribute().is_type(['1', '2'])
        False
        >>> ListAttribute().is_type(["|"], delimiter='|')
        True
        >>> ListAttribute().is_type(['1', '|'], delimiter='|')
        True
        """
        first_line = lines[0]

        if delimiter in first_line:
            return True

        if len(lines) > 1:
            second_line = lines[1]
            if second_line.startswith(delimiter):
                return True

        return False

    def parse_attribute(self, lines):
        subattribute = parse_line(lines)

        if subattribute:
            return subattribute, subattribute.unconsumed
        else:
            return None, []

        # subattributes = []
        # unconsumed = []
        # if subattribute:
        #     subattributes.append(subattribute)
        #     unconsumed = subattribute.unconsumed

        # if unconsumed:
        #     if self.should_close_context(unconsumed):
        #         unconsumed = self.close_context(unconsumed)
        #     else:
        #         other_subattributes, unconsumed = self.parse_attribute(unconsumed)
        #         subattributes += other_subattributes

        # return subattributes, unconsumed

    def value_string(self, to_write=False):
        value_strings = []

        for subvalue in self.value:
            if to_write:
                value_strings += subvalue.write().split("\n")
            else:
                value_strings += str(subvalue).split("\n")

        value_string = "\n".join(["    " + s for s in value_strings])

        if value_string:
            value_string = "\n{}\n".format(value_string)

        return value_string


    def __str__(self):
        return "{key} ({kind}): [{value}]".format(
            kind=self.kind,
            key=self.key,
            value=self.value_string(),
        )

    def write(self):
        return "{key} [{value}]".format(
            key=self.key,
            value=self.value_string(to_write=True),
        )

################################################################################
#
#
#
#
#
#
#                                   Parsing
#
#
#
#
#
#
################################################################################
def parse_line(lines):
    # order is important here
    attribute_types = [
        LineComment,
        IntegerAttribute,
        FloatAttribute,
        StringAttribute,
        ListAttribute,
    ]

    for attribute_type in attribute_types:
        attribute = attribute_type(lines)

        if attribute.is_type(lines):
            attribute.read()
            return attribute

def parse_lines(lines):
    attribute = parse_line(lines)

    if attribute:
        return attribute, attribute.unconsumed
    else:
        # if we couldn't parse the line, move on
        return None, lines[1:]

def format_parsed_content(parsed, validate=True):
    all_attributes = []
    for attribute in parsed:
        key = attribute.key
        if key == 'graph':
            graph_attributes = []

            for sub in attribute.value:
                value = format_value(sub)
                if sub.key == 'edge':
                    if validate and not edge_is_valid(value):
                        raise EdgeError
                
                graph_attributes.append((sub.key, value))

            all_attributes.append(('graph', graph_attributes))
        else:
            all_attributes.append((key, format_value(attribute)))

    if validate:
        ids_are_valid(all_attributes)

    return all_attributes

def format_value(attribute):
    if type(attribute) == ListAttribute:
        return [( sub.key, format_value(sub) ) for sub in attribute.value ]
    else:
        return attribute.value

def ids_are_valid(content):
    ids_dict = {}
    for _id in get_ids(content):
        if not ids_dict.get(_id):
            ids_dict[_id] = True
        else:
            raise DuplicateIdsError(message="duplicate id: {}".format(_id))

def get_ids(_object):
    ids = []
    _subobjects = []
    if type(_object) == list:
        _subobjects = _object
    if type(_object) == tuple:
        key, value = _object

        if key == 'id':
            ids.append(value)

        if type(value) == list:
            _subobjects = value

    for _subobject in _subobjects:
        ids += get_ids(_subobject)

    return ids

def edge_is_valid(edge):
    """
    >>> edge_is_valid([('source', 1), ('target', 1)])
    True
    >>> edge_is_valid([('source', 1)])
    False
    >>> edge_is_valid([('target', 1)])
    False
    """
    has_source = False
    has_target = False

    for key, _ in edge:
        if key == 'source':
            has_source = True
        if key == 'target':
            has_target = True
    
    return has_source and has_target

################################################################################
#
#
#
#
#
#
#                                   Errors
#
#
#
#
#
#
################################################################################
class ListParseError(Exception):
    """raised when a list is poorly formatted"""
    pass

class BooleanParseError(Exception):
    """raised when a boolean is poorly formatted"""
    pass

class EdgeError(Exception):
    """raised when an edge is missing `source` or `target`"""
    pass

class DuplicateIdsError(Exception):
    """raised when we've found duplicate ids"""
    def __init__(self, message):
        super().__init__(message)

if __name__ == '__main__':
    import doctest
    doctest.testmod()
