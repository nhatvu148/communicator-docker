#!/usr/bin/env python3

#This script is compatible with Python 3.x and 2.x, though 3.x is STRONGLY recommended
#due to its improved handling of Unicode when interacting with the operating system.


#Imports--------------------------------------------------------------
import os
import os.path
import imp
import shutil
import sys
import socket
import time
import re
import sys
import webbrowser
import signal
import time
import traceback
import subprocess
import platform

try:
    #Python 2.x
    
    from string import replace as stringreplace
    from string import split as stringsplit

    from urlparse import urlparse
    from urlparse import urlunparse

    def expand_user(path):
        return unicode(os.path.expanduser(path).decode(sys.getdefaultencoding()))
    
except:
    #Python 3.x

    def stringreplace(s, old, new):
        return s.replace(old, new)

    def stringsplit(s, sep, maxsplit = -1):
        return s.split(sep, maxsplit)

    from urllib.parse import urlparse
    from urllib.parse import urlunparse

    def unicode(obj):
        return str(obj)

    def expand_user(path):        
        return os.path.expanduser(path)


#Utilities------------------------------------------------------------
def to_utf8(text):
    return text.encode(u'utf-8')

def from_utf8(byte_array):
    return unicode(byte_array.decode(u'utf-8'))

def default_ignore_decode(byte_array):
    #Deocdes using default system encoding, ignore bytes that cause decode errors
    return unicode(byte_array.decode(sys.getdefaultencoding(), u'ignore'))

def call(obj, *args):
    #Calls the specified object if it's callable. Otherwise it does nothing
    if obj is not None and hasattr(obj, u'__call__'):
        return obj(*args)

def call_or_value(obj, *args):
    #Calls the specifed object or returns the object if it isn't callable    
    if obj is not None and hasattr(obj, u'__call__'):
        return obj(*args)
    else:
        return obj

def get_cwd():
    #This method exists to make it easier to test alternative working directories
    return os.getcwd()

#get_network_interfaces() puts the addresses into this order
IPV4_ADDRESS_INDEX = 0
IPV6_ADDRESS_INDEX = 1

def get_network_interfaces(value_index = None):
    #Enumerates the network interfaces on this computer by parsing the output of
    #ipconfig (Windows) or ifconfig (Linux)
    #It does this to avoid a dependency on an non-standard Python module
    
    results = []

    if platform.system() == u'Windows':
        proc = subprocess.Popen(u'ipconfig', stdin = subprocess.PIPE, stdout = subprocess.PIPE, stderr = subprocess.PIPE)
    else:
        proc = subprocess.Popen(u'ifconfig', stdin = subprocess.PIPE, stdout = subprocess.PIPE, stderr = subprocess.PIPE)

    stdout_bytes, stderr_bytes = proc.communicate()
    stdout_string, stderr_string = default_ignore_decode(stdout_bytes), default_ignore_decode(stderr_bytes)
        
    if platform.system() == u'Windows':
        windows_items = []
        windows_item = None

        #Iterate over all lines
        for line in stringsplit(stdout_string, u'\n'):
            if len(line) > 0:
                if line[0] != u' ':
                    #Indicates a new network interface
                    if windows_item:
                        windows_items.append(windows_item)
                    windows_item = {}
                elif u':' in line:
                    #Add to current network interface
                    key, value = stringsplit(line, u':', 1) #Split on :

                    key = key.translate({ord(u'.') : u''}).strip() #Remove dots and leading/trailing spaces
                    if u'IPv4' in key:
                        key = u'IPv4'
                    elif u'IPv6' in key:
                        key = u'IPv6'

                    value = value.strip() #Remove leading/trailing spaces

                    windows_item[key] = value

        #Take care of last item
        if windows_item != None:
            windows_items.append(windows_item)

        for item in windows_items:
            ip4_address = None
            ip6_address = None
            if u'IPv4' in item:
                ip4_address = item[u'IPv4']
            if u'IPv6' in item:
                ip6_address = item[u'IPv6']

            if ip4_address or ip6_address:
                results.append([ip4_address, ip6_address])
    else:
        for item in re.findall(u'^(\\S+).*?inet addr:(\\S+).*?Mask:(\\S+).*?inet6 addr: (\\S+)', stdout_string, re.S | re.M):
            results.append([item[1], item[3]])

    if value_index is not None:
        results = [item[value_index] for item in results if item[value_index]]

    return results

DEFAULT_NETWORK_TIMEOUT_SECONDS = 10

NEWLINE_STRING = u'\r\n'

BOOLEAN_STRINGS = (u'yes', u'no', u'true', u'false')

LOCALHOST_ADDRESSES = (u'127.0.0.1', u'::1')

ANY_ADDRESSES = (u'0.0.0.0', u'::0')

STANDARD_ADDRESSES = {
    #Just IPv4 addresses is sufficient
    u'localhost' : u'127.0.0.1',
    u'any' : u'0.0.0.0',
    }

DEFAULT_SCHEME_PORTS = {
    u'http' : 80,
    u'https' : 443,
    u'ws' : 80,
    u'wss' : 443
    }

#IP address matchers. The IPV6 matcher matches on an optional zone ID. From https://gist.github.com/mnordhoff/2213179
IPV4_ADDRESS_MATCHER = re.compile('^(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$')
IPV6_ADDRESS_MATCHER = re.compile('^(?:(?:[0-9A-Fa-f]{1,4}:){6}(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))|::(?:[0-9A-Fa-f]{1,4}:){5}(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))|(?:[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){4}(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))|(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){3}(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))|(?:(?:[0-9A-Fa-f]{1,4}:){,2}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){2}(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))|(?:(?:[0-9A-Fa-f]{1,4}:){,3}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}:(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))|(?:(?:[0-9A-Fa-f]{1,4}:){,4}[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:[0-9A-Fa-f]{1,4}|(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))|(?:(?:[0-9A-Fa-f]{1,4}:){,5}[0-9A-Fa-f]{1,4})?::[0-9A-Fa-f]{1,4}|(?:(?:[0-9A-Fa-f]{1,4}:){,6}[0-9A-Fa-f]{1,4})?::)(?:%25(?:[A-Za-z0-9\\-._~]|%[0-9A-Fa-f]{2})+)?$')

def simplify_urls(text):    
    #Simplify URLs with http://address:80, changing them to http://address, and so on for all URLs

    #This pattern is from: https://gist.github.com/uogbuji/705383
    URL_PATTERN = u"""(?i)\\b((?:https?://|www\\d{0,3}[.]|[a-z0-9.\\-]+[.][a-z]{2,4}/)(?:[^\\s()<>]+|\\(([^\\s()<>]+|(\\([^\\s()<>]+\\)))*\\))+(?:\\(([^\\s()<>]+|(\\([^\\s()<>]+\\)))*\\)|[^\\s`!()\\[\\]{};:\\'".,<>?\\xab\\xbb\\u201c\\u201d\\u2018\\u2019]))"""

    for url_match in re.findall(URL_PATTERN, text):
        url = urlparse(url_match[0])
        if url.port and url.scheme in DEFAULT_SCHEME_PORTS and DEFAULT_SCHEME_PORTS[url.scheme] == url.port:
            #Port is redundant. Remove it from URL
            new_url = urlunparse((url.scheme, url.netloc.split(':')[0], url.path, url.params, url.query, url.fragment))
            text = stringreplace(text, url_match[0], new_url)

    return text


#Fields---------------------------------------------------------------
class _DocumentationField:
    def __init__(self, label):
        self.label = label        

    def process(self, interaction):
        interaction.print_line(self.label)        

class _ConstantField:
    def __init__(self, label, replace_key, value):
        self.label = label
        self.replace_key = replace_key
        self.value = value

class _BooleanField:
    #The value is a string containing one of BOOLEAN_STRINGS
    
    def __init__(self, label, replace_key, required = True, default_value = None):
        self.label = label
        self.replace_key = replace_key
        self.required = required
        self.value = None
        self.default_value = default_value

    def process(self, interaction):
        label = self.label

        if self.default_value is not None:
            label = u'{0} (example: {1}) (default: {2})'.format(label, u', '.join(BOOLEAN_STRINGS), self.default_value)
        else:
            label = u'{0} (example: {1})'.format(label, u', '.join(BOOLEAN_STRINGS))
            
        interaction.print_input_prompt(label)
        if interaction.is_manual() or self.default_value is None:
            self.value = interaction.input_boolean_string(self.required and self.default_value is None)

        if not self.value and self.default_value is not None:
            interaction.print_line(u'Using default: {0}'.format(self.default_value))
            self.value = self.default_value

    def boolean_value(self):
        return self.value not in (u'false', u'no') #Assume true if not false

class _IntegerField:
    def __init__(self, label, replace_key, min_value, max_value, required = True, default_value = None):
        self.label = label
        self.replace_key = replace_key
        self.required = required
        self.min_value = min_value
        self.max_value = max_value
        self.value = None
        self.default_value = int(default_value) if default_value is not None else None
        
    def process(self, interaction):
        label = self.label

        if self.default_value is not None:
            label = u'{0} ({1}-{2}) (default: {3})'.format(label, self.min_value, self.max_value, unicode(self.default_value))
        else:
            label = u'{0} ({1}-{2})'.format(label, self.min_value, self.max_value)
                
        interaction.print_input_prompt(label)        
        if interaction.is_manual() or self.default_value is None:
            self.value = interaction.input_int_in_range(self.min_value, self.max_value, self.required and self.default_value is None)
            
        if self.value is None and self.default_value is not None:
            interaction.print_line(u'Using default: {0}'.format(self.default_value))
            self.value = self.default_value
    
class _TextField:
    def __init__(self, label, replace_key, required = True, default_value = None):
        self.label = label
        self.replace_key = replace_key
        self.required = required
        self.value = None
        self.default_value = default_value
        
    def process(self, interaction):
        label = self.label

        if self.default_value is not None:
            label = u'{0} (default: {1})'.format(label, self.default_value)
                
        interaction.print_input_prompt(label)        
        if interaction.is_manual() or self.default_value is None:
            self.value = self.process_value(interaction.input_string(self.required and self.default_value is None), interaction)
            
        if not self.value and self.default_value is not None:
            interaction.print_line(u'Using default: {0}'.format(self.default_value))
            self.value = self.process_value(self.default_value, interaction)

    def process_value(self, value, interaction):
        return value

class _MultipleTextField:
    def __init__(self, label, replace_key, inner_replace_key, minimum = 1, maximum = None, default_value = None):
        default_value = default_value or []
        
        self.label = label
        self.replace_key = replace_key
        self.inner_replace_key = inner_replace_key
        self.minimum = max(minimum, len(default_value))
        self.maximum = max(self.minimum, maximum or 1000000)
        self.value = None
        self.default_value = default_value
        
    def process(self, interaction):
        values = []
        
        for field_index in range(self.minimum + self.maximum):
            required = field_index < self.minimum
            if interaction.is_automatic() and not required:
                break

            default_value = self._get_default_value(field_index)

            if field_index == 0:
                label = self.label
            elif required:
                if self.label.startswith(u'Enter the'):
                    label = stringreplace(self.label, u'Enter the', u'Enter another')                    
                else:
                    label = u'Enter another'
            else:
                if self.label.startswith(u'Enter the'):
                    label = stringreplace(self.label, u'Enter the', u'Enter another')
                    if not default_value:
                        label = u'{0} (optional, leave empty to skip)'.format(label)
                else:
                    if not default_value:
                        label = u'Enter another (optional, leave empty to skip)'
            
            if default_value is not None:
                label = u'{0} (default: {1})'.format(label, default_value)
                    
            interaction.print_input_prompt(label)
            value = None
            
            if interaction.is_manual() or default_value is None:
                value = interaction.input_string(required and default_value is None)
                if value:
                    value = self.process_value(value, interaction)

            if not value and default_value is not None:
                interaction.print_line(u'Using default: {0}'.format(default_value))
                value = self.process_value(default_value, interaction)

            if not value:
                break
            
            values.append(value)

        self.value = u''.join([stringreplace(self.replace_key, self.inner_replace_key, value) for value in values])        

    def _get_default_value(self, index):
        if not self.default_value or index >= len(self.default_value):
            return None

        return self.default_value[index]

    def process_value(self, value, interaction):
        return value

class _PathField(_TextField):
    def __init__(self, label, replace_key, required = True, default_value = None):
        _TextField.__init__(self, label, replace_key, required, default_value)

    def process_value(self, value, interaction):
        return interaction.complete_path(value)

class _MultiplePathField(_MultipleTextField):
    def __init__(self, label, replace_key, inner_replace_key, minimum = 1, maximum = None, default_value = None):
        _MultipleTextField.__init__(self, label, replace_key, inner_replace_key, minimum, maximum, default_value)

    def process_value(self, value, interaction):
        return interaction.complete_path(value)
    
class _IpAddressField:
    def __init__(self, label, replace_key, required = True, default_value = None):
        self.label = label
        self.replace_key = replace_key
        self.required = required
        self.value = None
        self.default_value = default_value

    def process(self, interaction):
        label = self.label

        values = interaction.get_ip_addresses()
        for address_name in STANDARD_ADDRESSES:
            values.append(address_name)
        
        if values:
            if self.default_value is not None:
                label = u'{0} (default: {1})'.format(label, self.default_value)
            else:
                label = u'{0} (example: {1})'.format(label, u', '.join(unicode(item) for item in values))
            
        interaction.print_input_prompt(label)
        if interaction.is_manual() or self.default_value is None:
            self.value = interaction.input_ip_address(self.required and self.default_value is None)

        if not self.value and self.default_value is not None:
            interaction.print_line(u'Using default: {0}'.format(self.default_value))
            self.value = STANDARD_ADDRESSES[self.default_value] if self.default_value in STANDARD_ADDRESSES else self.default_value

            if not interaction.is_ip_address(self.value):
                interaction.print_line(u'Default value is not a valid IP address. The generated settings file may not function properly.')

    def is_localhost_address(self):
        return self.value in LOCALHOST_ADDRESSES

    def is_any_address(self):
        return self.value in ANY_ADDRESSES

    
#Interaction model--------------------------------------------------------------
class Interaction:
    DocumentationField = _DocumentationField
    ConstantField = _ConstantField
    BooleanField = _BooleanField
    IntegerField = _IntegerField
    TextField = _TextField
    MultipleTextField = _MultipleTextField
    PathField = _PathField
    MultiplePathField = _MultiplePathField
    IpAddressField = _IpAddressField
    
    MANUAL_MODE = 1
    AUTOMATIC_MODE = 2

    NO_PATH_COMPLETION = 1
    ABSOLUTE_PATH_COMPLETION = 2
    
    def __init__(self, args = None):
        self.show_enumeration_information = True
        
        self.timestamp_affix = time.strftime(u'%Y%m%d_%H%M%S', time.localtime())

        self.template_file_base_name_no_ext = u'template'
        self.template_file_base_name = self.template_file_base_name_no_ext + u'.py'

        #Process command line arguments
        raw_args = args or sys.argv[1:]
        self.args = [self.prepare_command_line_setting(arg) for arg in raw_args]
        
        if self.has_command_line_setting(u'auto'):
            self.mode = Interaction.AUTOMATIC_MODE
        else:
            self.mode = Interaction.MANUAL_MODE

        if self.has_command_line_setting(u'nopathcompletion'):
            self.path_completion = Interaction.NO_PATH_COMPLETION
        else:
            self.path_completion = Interaction.ABSOLUTE_PATH_COMPLETION

        if self.has_command_line_setting(u'nonetwork'):
            self.network_access_enabled = False
        else:
            self.network_access_enabled = True

        logging_enabled = not self.has_command_line_setting(u'nolog')
        self.stdout_enabled = not self.has_command_line_setting(u'nostdout')
        self.default_template_name = self.get_command_line_setting(u'default') or self.get_command_line_setting(u'defaulttemplate') #A subdirectory in self.templates_directory
        self.templates_directory = self.get_command_line_setting(u'templates') or self.get_command_line_setting(u'templatesdirectory')
        self.working_directory = self.get_command_line_setting(u'workingdirectory') or get_cwd()
        self.log_directory = self.get_command_line_setting(u'logdirectory')
        self.output_directory = self.get_command_line_setting(u'outputdirectory')
        self.finish_urls = self.get_command_line_setting(u'finishurl', None) or ()
        self.finish_message = self.get_command_line_setting(u'finishmessage')
        self.wait_for_input_at_finish = self.has_command_line_setting(u'waitforinputatfinish')

        #Complete some paths
        if self.working_directory:
            self.working_directory = os.path.normpath(os.path.join(get_cwd(), expand_user(self.working_directory)))
        if self.templates_directory:
            self.templates_directory = os.path.normpath(os.path.join(self.working_directory, expand_user(self.templates_directory)))
        if self.log_directory:
            self.log_directory = os.path.normpath(os.path.join(self.working_directory, expand_user(self.log_directory)))
        if self.output_directory:
            self.output_directory = os.path.normpath(os.path.join(self.working_directory, expand_user(self.output_directory)))
            if not os.path.exists(self.output_directory):
                os.makedirs(self.output_directory)

        #Determine log directory and open log file
        self.interaction_log = None
        if logging_enabled:
            if self.log_directory:
                log_directory = self.log_directory
            else:
                log_directory = os.path.join(self.working_directory, u'log')

            if not os.path.exists(log_directory):
                os.makedirs(log_directory)

            log_file_name = os.path.join(log_directory, u'settingsbuilder_interaction_' + self.timestamp_affix + u'.log')
            self.interaction_log = open(log_file_name, u'wb')

            self.log_line(u'Python ' + sys.version)
            if raw_args:
                self.log_line(u'Command line arguments: ' + unicode(raw_args))
            else:
                self.log_line(u'Command line arguments: ')
            self.log_line()

    def __del__(self):
        if self.interaction_log:
            self.interaction_log.close()

    def finish(self):
        if self.interaction_log:
            self.interaction_log.close()
            self.interaction_log = None

    def finish_interrupt(self, signal, frame):
        #Called when the application is interrupted
        self.finish()
        sys.exit(0)
        
    def is_manual(self):
        return self.mode == Interaction.MANUAL_MODE

    def is_automatic(self):
        return self.mode == Interaction.AUTOMATIC_MODE
            
    def write_output(self, message):
        if self.stdout_enabled:
            sys.stdout.write(message)
            sys.stdout.flush()
        
        if self.interaction_log:
            self.interaction_log.write(to_utf8(message))
            self.interaction_log.flush()
        
    def print_line(self, message = ''):
        if self.stdout_enabled:
            print(message)
            sys.stdout.flush()
        
        self.log_line(message)

        return self

    def log_line(self, message = None):
        if self.interaction_log:
            if message:
                self.interaction_log.write(to_utf8(message))
            self.interaction_log.write(to_utf8(NEWLINE_STRING))
            self.interaction_log.flush()

    def print_traceback(self):
        self.write_output(stringreplace(traceback.format_exc(), u'\n', NEWLINE_STRING))

    def prepare_for_slow_network_operation(self, message = None):
        if message:
            self.print_line().print_line(u'Performing {0}. This may take up to {1} seconds. Please be patient.'.format(message, DEFAULT_NETWORK_TIMEOUT_SECONDS))
        
    def input_required_int(self):
        while True:
            int_string = sys.stdin.readline().strip()
            self.log_line(int_string)
            try:
                return int(int_string) 
            except:
                self.write_output(u'You must enter an integer: ')

    def input_required_int_in_range(self, min_value, max_value):
        while True:
            int_string = sys.stdin.readline().strip()
            self.log_line(int_string)
            
            try:                
                int_value = int(int_string)
                if int_value < min_value or int_value > max_value:
                    self.write_output(u'You must enter a value between {0} and {1}: '.format(min_value, max_value))
                else:
                    return int_value
            except:
                self.write_output(u'You must enter a value between {0} and {1}: '.format(min_value, max_value))

    def input_optional_int_in_range(self, min_value, max_value, default_value = None):
        while True:
            int_string = sys.stdin.readline().strip()
            self.log_line(int_string)

            if int_string == u'':
                return default_value
            
            try:                
                int_value = int(int_string)
                if int_value < min_value or int_value > max_value:
                    self.write_output(u'You must enter a value between {0} and {1}: '.format(min_value, max_value))
                else:
                    return int_value
            except:
                self.write_output(u'You must enter a value between {0} and {1}: '.format(min_value, max_value))

    def input_int_in_range(self, min_value, max_value, required, default_value = None):
        if required:
            return self.input_required_int_in_range(min_value, max_value)
        else:
            return self.input_optional_int_in_range(min_value, max_value, default_value)

    def input_boolean_string(self, required):
        while True:
            value = self.input_string(required)

            if not value and not required:
                return value
            elif value:
                if value.lower() in BOOLEAN_STRINGS:
                    #Exact match
                    return value.lower()
                else:
                    #Try the first character
                    boolean_string_chars = [s[0:1] for s in BOOLEAN_STRINGS]
                    try:
                        index = boolean_string_chars.index(value.lower())                    
                        return BOOLEAN_STRINGS[index]
                    except:
                        pass

                    #Nothing matched
                    self.write_output(u'You must enter a valid boolean ({0}): '.format(u', '.join(BOOLEAN_STRINGS)))
                
    def input_ip_address(self, required):
        while True:
            value = self.input_string(required)

            if not value and not required:
                return value
            elif value:
                if value.lower() in STANDARD_ADDRESSES:
                    return STANDARD_ADDRESSES[value.lower()]
                elif value and self.is_ip_address(value):
                    return value

            self.write_output(u'You must enter a valid IP address: ')
                
    def input_string(self, required):
        if required:
            return self.input_required_string()
        else:
            return self.input_optional_string()
            
    def input_required_string(self):
        while True:
            s = sys.stdin.readline().strip()
            self.log_line(s)
            if len(s) > 0:
                return s
            else:
                self.write_output(u'You must enter a value: ')

    def input_optional_string(self):
        s = sys.stdin.readline().strip()
        self.log_line(s)
        return s

    def input_optional_path(self):
        path = self.input_string(False)
        if path:
            path = os.path.normpath(os.path.join(self.working_directory, expand_user(path)))
        return path

    def print_input_prompt(self, message):
        self.write_output(NEWLINE_STRING)
        self.write_output(u'{0}: '.format(message))

    def get_best_private_ip_address(self):
        if not self.network_access_enabled:
            return None

        network_addresses = get_network_interfaces(IPV4_ADDRESS_INDEX)
        if network_addresses:
            return network_addresses[0]
        
        hostname = socket.gethostname().lower()
        return socket.gethostbyname(hostname)

    def get_best_public_name(self, private_address = None):
        if not self.network_access_enabled:
            return None
        
        if private_address is None:
            private_address = self.get_best_private_ip_address()
        if private_address is None:
            return None

        if self.is_localhost_address(private_address):
            return u'localhost'

        self.prepare_for_slow_network_operation(u'reverse name lookup for {0}'.format(private_address))
        try:
            name, aliases, ips = socket.gethostbyaddr(private_address)
            if name:
                return name.lower()
        except:
            pass

        return None

    def get_best_public_ip_address(self, private_address = None):
        if not self.network_access_enabled:
            return None
        
        if private_address is None:
            private_address = self.get_best_private_ip_address()
        if private_address is None:
            return None

        self.prepare_for_slow_network_operation(u'reverse name lookup for {0}'.format(private_address))
        try:
            name, aliases, ips = socket.gethostbyaddr(private_address)
            if ips:
                return ips[0]
        except:
            pass

        return None
    
    def get_network_names(self, hostname_or_addr = None):
        if not self.network_access_enabled:
            return None
        
        if hostname_or_addr is None:
            hostname_or_addr = self.get_best_private_ip_address()

        self.prepare_for_slow_network_operation(u'network information lookup for {0}'.format(hostname_or_addr))
        try:
            name, aliases, ips = socket.gethostbyaddr(hostname_or_addr)
            if name:            
                return [name.lower()] + [alias.lower() for alias in aliases]
        except:
            pass

        return []
    
    def get_ip_addresses(self, hostname = None):
        if not self.network_access_enabled:
            return None
        
        if hostname is not None:
            return socket.gethostbyname_ex(hostname)[2]
        else:
            addresses = []
            for interface in get_network_interfaces():
                if interface[IPV4_ADDRESS_INDEX]:
                    addresses.append(interface[IPV4_ADDRESS_INDEX])
                if interface[IPV6_ADDRESS_INDEX]:
                    addresses.append(interface[IPV6_ADDRESS_INDEX])
            return addresses

    def get_network_names_and_ip_addresses(self, hostname = None):
        if not self.network_access_enabled:
            return None
        
        if hostname is None:
            hostname = socket.gethostname().lower()        
            
        return self.get_network_names(hostname) + self.get_ip_addresses(hostname)

    def get_setting(self, name):
        #Gets the setting from the command line or environment
        return self.get_command_line_setting(name) or os.environ.get(name, None)
    
    def is_command_line_setting_format(self, name):
        return len(name) > 1 and name[0] == u'-'

    def prepare_command_line_setting(self, arg):
        if self.is_command_line_setting_format(arg):
            return arg.lower()
        else:
            return arg
    
    def select_command_line_setting(self, values, value_index = None):
        if value_index is None:
            return values
        elif value_index is None or value_index >= len(values):
            return None
        else:
            return values[value_index]
            
    def get_command_line_setting_index(self, name):
        name = name.lower()
        try:
            return self.args.index(u'-' + name)            
        except ValueError:
            try:
                return self.args.index(u'--' + name)
            except ValueError:
                return None

    def has_command_line_setting(self, name):
        return self.get_command_line_setting_index(name) != None
        
    def get_command_line_setting(self, name, value_index = 0, none_value = None):
        name_index = self.get_command_line_setting_index(name)
        if name_index is None:
            return none_value
            
        end_index = name_index + 1
        while end_index < len(self.args):
            if self.is_command_line_setting_format(self.args[end_index]):
                return self.select_command_line_setting(self.args[name_index + 1 : end_index], value_index)
            
            end_index += 1

        return self.select_command_line_setting(self.args[name_index + 1:], value_index)

    def complete_path(self, the_path):
        if the_path:
            if self.path_completion == Interaction.ABSOLUTE_PATH_COMPLETION:
                return os.path.normpath(os.path.join(self.working_directory, expand_user(the_path)))
            else:
                return the_path

    def read_binary_file(self, filename):
        f = open(filename, u'rb')
        file_bytes = f.read()
        f.close()
        return file_bytes
    
    def read_text_file(self, filename):
        return from_utf8(self.read_binary_file(filename))

    def write_text_file(self, filename, text):
        self.print_line(u'Writing file to \'{0}\'.'.format(filename))
        
        f = open(filename, u'wb')
        f.write(to_utf8(text))
        f.close()

    def copy_file(self, destination, source):
        #For the time being, it doesn't seem useful to display information for files that are simply copied
        #self.print_line(u'Copying file \'{0}\' to file \'{1}\'.'.format(source, destination))
        shutil.copyfile(source, destination)

    def is_localhost_address(self, value):
        return value in LOCALHOST_ADDRESSES

    def is_any_address(self, value):
        return value in ANY_ADDRESSES

    def is_ip_address(self, value):
        if not value:
            return False
        
        try: 
            socket.inet_aton(value)
            return True
        except:
            try: 
                socket.inet_pton(socket.AF_INET6, value)
                return True
            except:
                return False

    def is_ipv4_address(self, value):
        if not value:
            return False
        
        return IPV4_ADDRESS_MATCHER.search(value) != None

    def is_ipv6_address(self, value):
        if not value:
            return False
        
        return IPV6_ADDRESS_MATCHER.search(value) != None

    def format_host_for_uri(self, value):
        if self.is_ipv6_address(value):
            return u'[' + value + u']'
        
        return value
            

#Settings template----------------------------------------------------
class SettingsTemplate:
    def __init__(self, subdirectory, directory, module, interaction):
        self.subdirectory = subdirectory
        
        self.directory = directory 

        self.display_name = getattr(module, u'display_name', subdirectory)

        self.description = getattr(module, u'description', u'<none>')

        self.fields = call_or_value(getattr(module, u'fields'), interaction)
                
        self.extensions = getattr(module, u'extensions', (u'.xml',))

        self.finish = getattr(module, u'finish', None)

#Application support functions----------------------------------------
def find_templates(interaction):
    templates = []

    #Select templates directory
    if interaction.templates_directory is not None:
        templates_directory = interaction.templates_directory
    else:
        templates_directory = os.path.join(os.path.dirname(__file__), u'templates')

    #Look in immediate subdirectories beneath templates directory
    for input_file_or_subdirectory in os.listdir(templates_directory):
        input_file_or_subdirectory_full_path = os.path.join(templates_directory, input_file_or_subdirectory)
        
        if os.path.isdir(input_file_or_subdirectory_full_path):
            template_subdirectory = input_file_or_subdirectory_full_path
            
            template_file_path = os.path.join(template_subdirectory, interaction.template_file_base_name)
            if os.path.isfile(template_file_path):
                #The subdirectory has a template.py file. Load it
                module_description = imp.find_module(interaction.template_file_base_name_no_ext, [template_subdirectory])
                template_module = imp.load_module(interaction.template_file_base_name_no_ext + unicode(len(templates)), *module_description)

                #Add new template
                templates.append(SettingsTemplate(input_file_or_subdirectory, template_subdirectory, template_module, interaction))            
            elif interaction.show_enumeration_information:
                interaction.print_line(u'Failed to find {0} in {1}. Skipping.'.format(template_file_path, template_subdirectory))
        
    return sorted(templates, key = lambda template : template.display_name)

def find_template_index_by_subdirectory(templates, subdirectory, interaction):
    for index, template in enumerate(templates):
        if template.subdirectory == subdirectory:
            return index

def select_template(templates, interaction):
    if len(templates) == 0:
        return None
    else:
        #List the templates
        interaction.print_line(u'The following templates were found:')
        for index, template in enumerate(templates):
            interaction.print_line().print_line(u'{0}) {1} - {2}'.format(index + 1, template.display_name, template.description))
            
        #If there's only one, select it
        if len(templates) == 1:            
            return templates[0]

        #There's more than one
        label = u'Enter the number of the template to use ({0}-{1})'.format(1, len(templates))

        #Find default, if there is one
        if interaction.default_template_name:
            default_template_index = find_template_index_by_subdirectory(templates, interaction.default_template_name, interaction)
        else:
            default_template_index = -1

        #Update label if there's a default
        if default_template_index >= 0:
            label = u'{0} (default: {1})'.format(label, default_template_index + 1)
            print (label)

        #Get the desired template index
        template_index = -1    
        interaction.print_input_prompt(label)        
        if interaction.is_manual() or default_template_index < 0:
            template_index = interaction.input_int_in_range(1, len(templates), required = default_template_index < 0, default_value = -1) - 1

        #Use default if necessary
        if template_index < 0 and default_template_index >= 0:
            interaction.print_line(u'Using default: {0}'.format(default_template_index + 1))
            template_index = default_template_index

        return templates[template_index]
        
def select_output_directory(template, interaction):
    timestamped_template_name = interaction.timestamp_affix + u'_' + template.subdirectory
    default_value = interaction.output_directory or os.path.join(os.path.join(interaction.working_directory, u'output'), timestamped_template_name)
    interaction.print_input_prompt(u'Enter the output directory where the settings will be generated (default: {0})'.format(default_value))
    
    output_directory = None
    if interaction.is_manual() or default_value is None:
        output_directory = interaction.input_optional_path()

    if not output_directory and default_value is not None:
        interaction.print_line(u'Using default: {0}'.format(default_value))
        output_directory = default_value

    if not os.path.exists(output_directory):
        os.makedirs(output_directory)

    return os.path.normpath(output_directory)

def clean_content(file_content):
    file_content = simplify_urls(file_content) #Simplify things like http://address:80
    file_content = stringreplace(file_content, u'[-]', u'') #Remove degenerate numeric ranges
    return file_content

def apply_template_to_text(text, keys_to_values_pattern, keys_to_values):
    return re.sub(keys_to_values_pattern, lambda matched_key : keys_to_values[matched_key.group(0)], text)
    
def apply_template_to_directory(interaction, template, keys_to_values_pattern, keys_to_values, input_directory, output_directory, allow_template_file_copy = False):
    filtered_files = getattr(template.fields, u'filtered_files', [])
    #[Test]interaction.print_line('filtered_files = {0}'.format(filtered_files))

    if not os.path.exists(output_directory):
        os.makedirs(output_directory)
            
    for input_file_or_subdirectory in os.listdir(input_directory):
        path, filename = os.path.split(input_file_or_subdirectory)
        file, extension = os.path.splitext(filename)
        #[Test]filtered = filename in filtered_files
        #[Test]interaction.print_line('file = {0}, filtered = {1}'.format(filename, filtered))

        input_file_or_subdirectory_full_path = os.path.join(input_directory, input_file_or_subdirectory)

        if input_file_or_subdirectory == u'__pycache__' or extension == u'.pyc' or (input_file_or_subdirectory == interaction.template_file_base_name and not allow_template_file_copy):
            pass
        elif os.path.isdir(input_file_or_subdirectory_full_path):
            apply_template_to_directory(interaction, template, keys_to_values_pattern, keys_to_values, input_file_or_subdirectory_full_path, os.path.join(output_directory, input_file_or_subdirectory), True)
        elif filename in filtered_files:
            pass
        elif extension in template.extensions:
            #Read file content
            file_content = interaction.read_text_file(input_file_or_subdirectory_full_path)
            
            #lets the template perform an operation on the text file to be parsed, i.e. remove non relevant parts
            filter_content_func = getattr(template.fields, u'filter_content', None)
            if filter_content_func is not None: 
                file_content = filter_content_func(file_content)
                
            file_content = apply_template_to_text(file_content, keys_to_values_pattern, keys_to_values)
                        
            #Clean up content
            file_content = clean_content(file_content)
                        
            #Write file content
            interaction.write_text_file(os.path.join(output_directory, input_file_or_subdirectory), file_content)
        else:
            #Just copy the input file to the output directory
            interaction.copy_file(os.path.join(output_directory, input_file_or_subdirectory), input_file_or_subdirectory_full_path)            

def call_network_functions(interaction):
    #Useful for viewing the current system
    print(u'socket.gethostname(): ' + socket.gethostname())
    print(u'Best IP address: ' + unicode(interaction.get_best_private_ip_address()))
    print(u'Best public name: ' + unicode(interaction.get_best_public_name()))
    print(u'Best public IP address: ' + unicode(interaction.get_best_public_ip_address()))
    print(u'Network names: ' + unicode(interaction.get_network_names()))
    print(u'IP addresses: ' + unicode(interaction.get_ip_addresses()))
    print(u'Network names and IP addresses: ' + unicode(interaction.get_network_names_and_ip_addresses()))
    print(u'Network interfaces: ' + unicode(get_network_interfaces()))
    
    
#Main-----------------------------------------------------------------
def main_interaction(interaction):
    #The main interaction
    
    #Set interrupt handler
    signal.signal(signal.SIGINT, interaction.finish_interrupt)
    
    #Set socket default timeout 
    socket.setdefaulttimeout(float(DEFAULT_NETWORK_TIMEOUT_SECONDS)) 

    #call_network_functions(interaction)
    
    #Locate the templates
    templates = find_templates(interaction)

    #Select a template
    template = select_template(templates, interaction)
    if template:
        #Process each field in the template-------------------------------------
        processed_fields = []
        for field in template.fields:
            proc = getattr(field, u'process', None)
            call(proc, interaction)
            processed_fields.append(field)

        #Build settings---------------------------------------------------------
        output_directory = select_output_directory(template, interaction)
        interaction.print_line().print_line(u'Building settings in {0}:'.format(output_directory))

        #Replace keys in file with values in each respective field
        keys_to_values_list = []
        for field in processed_fields:
            replace_key = call_or_value(getattr(field, u'replace_key'), interaction)
            value = call_or_value(getattr(field, u'value'), interaction)
            if replace_key is not None and value is not None:
                #Ensure key and value are a string
                replace_key = unicode(replace_key)
                value = unicode(value)

                #Special IPV6 handling for URIs
                if interaction.is_ipv6_address(value):
                    for scheme in DEFAULT_SCHEME_PORTS:
                        keys_to_values_list.append((u'{0}://{1}'.format(scheme, replace_key), u'{0}://[{1}]'.format(scheme, value)))

                #Normal handling
                keys_to_values_list.append((replace_key, value))
                    
        keys_to_values_pattern = u'|'.join([u'(' + re.escape(key) + u')' for key, value in keys_to_values_list])

        keys_to_values = {}
        for key, value in keys_to_values_list:
            keys_to_values[key] = value
            
        apply_template_to_directory(interaction, template, keys_to_values_pattern, keys_to_values, template.directory, output_directory)

        #Handle finish----------------------------------------------------------
        if template.finish:
            template.finish(interaction, processed_fields)
        for finish_url in interaction.finish_urls:
            finish_url = apply_template_to_text(finish_url, keys_to_values_pattern, keys_to_values)
            webbrowser.open(finish_url)

        if interaction.finish_message:
            finish_message = apply_template_to_text(interaction.finish_message, keys_to_values_pattern, keys_to_values)
        else:
            finish_message = u'Done!'
        interaction.print_line().print_line(finish_message)

        if interaction.wait_for_input_at_finish:
            interaction.print_line().print_line(u'Press enter to exit.')
            interaction.input_optional_string()

def main(args = None):
    #The application entry point
    interaction = Interaction(args)
    result = 0 #Assume success

    try:
        main_interaction(interaction)
    except:
        interaction.print_line().print_line(u'There was an unhandled exception while running the settings builder:')
        interaction.print_traceback()
        result = 1

    interaction.finish()

    return result
    
if __name__ == u'__main__':
    result = main()
    sys.exit(result)
