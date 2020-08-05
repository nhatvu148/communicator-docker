import tempfile

display_name = u'Viewer Standalone'

description = u'Single-use stream cache CSR or SSR viewer.  Use this if you do not want to leverage services provided by Communicator Server.'

extensions = (u'.xml', )

#Some default constants
FILE_SERVER_HOST_PORT = 11180
SC_CSR_HOST_BASE_PORT = 11000
SC_CSR_BASE_PORT = 11200
SC_SSR_HOST_BASE_PORT = 11100
SC_SSR_BASE_PORT = 11400
SC_SERVER_ALLOW_ABSOLUTE_FILE_PATHS = u'yes'

#Field indexes
BIND_TO_ADDRESS_INDEX = 0
USE_IP_ADDRESS_INDEX = 1
PUBLIC_NAME_INDEX = 2
PUBLIC_IP_ADDRESS_INDEX = 3
PUBLIC_NAME_OR_IP_ADDRESS_INDEX = 4
SC_CACHE_DIRECTORY_INDEX = 6
SC_SERVER_SSL_CONFIGURE_INDEX = 7
SC_SERVER_SSL_RESPONSE_INDEX = 8

#An iterable class containing all the fields
class Fields:
    def __init__(self, interaction):
        self.interaction = interaction
        self.index = 0
        self.fields = None
        self.create_fields()

    def __iter__(self):
        return self

    def __next__(self):
        #Python 3.x next
        return self.next()
        
    def create_fields(self):
        self.fields = [
            #Field 0 - BIND_TO_ADDRESS_INDEX
            self.interaction.IpAddressField(
                u'Enter the private IP address of the network interface to bind to',
                u'{BIND_TO_ADDRESS}',
                required = False,
                default_value = self.interaction.get_command_line_setting(u'{BIND_TO_ADDRESS}') or self.interaction.get_best_private_ip_address()
                ),

            #Field 1 - USE_IP_ADDRESS_INDEX
            self.interaction.BooleanField(
                u'Should IP addresses appear in generated URIs?',
                u'{USE_IP_ADDRESS}',
                required = True,
                default_value = self.interaction.get_command_line_setting(u'{USE_IP_ADDRESS}') or u'yes'
                ),

            #Field 2 - PUBLIC_NAME_INDEX
            None, #Create it later since it depends on the previous field

            #Field 3 - PUBLIC_IP_ADDRESS_INDEX
            None, #Create it later since it depends on the previous field

            #Field 4 - PUBLIC_NAME_OR_IP_ADDRESS_INDEX
            None, #Create it later since it depends on the previous field
            
            #Field 5
            self.interaction.PathField(
                u'Enter the absolute path of the log directory',
                u'{LOG_DIRECTORY}',
                required = True,
                default_value = self.interaction.complete_path(self.interaction.get_command_line_setting(u'{LOG_DIRECTORY}')) or self.interaction.complete_path(u'~/communicator_logs')
                ),
            
            #Field 6
            self.interaction.MultiplePathField(
                u'Enter the path of a model search directory.',
                u'<modelSearchDirectory>{SC_SERVER_MODEL_SEARCH_DIRECTORY}</modelSearchDirectory>',
                u'{SC_SERVER_MODEL_SEARCH_DIRECTORY}',
                minimum = 1,
                maximum = None,
                default_value = [self.interaction.complete_path(setting) for setting in self.interaction.get_command_line_setting(u'{SC_SERVER_MODEL_SEARCH_DIRECTORY}', None, [])]
                ),
                
            #Field 7 - SC_SERVER_SSL_CONFIGURE_INDEX
            self.interaction.BooleanField(
                u'Do you need to configure SSL?',
                u'{CONFIGURE_SSL}',
                required = True,
                default_value = self.interaction.get_command_line_setting(u'{CONFIGURE_SSL}') or u'no'
                ),
                
            #Field 8 - SC_SERVER_SSL_RESPONSE_INDEX
            self.interaction.ConstantField(
                u'SSL Response',
                u'{SSL_RESPONSE}',
                0
                ),
            ]
    
    def next(self):
        #Python 2.x next
        if self.index >= len(self.fields):
            raise StopIteration

        current_index = self.index;
            
        if current_index == SC_SERVER_SSL_RESPONSE_INDEX:
            if self.fields[SC_SERVER_SSL_CONFIGURE_INDEX].boolean_value():
                new_fields = [
                    #Field 21
                    self.interaction.PathField(
                        u'Enter an absolute path to your SSL certificate',
                        u'{SC_SSL_CERTIFICATE}',
                        required = True,
                        default_value = self.interaction.get_command_line_setting(u'{SC_SSL_CERTIFICATE}')
                        ),

                    #Field 22
                    self.interaction.PathField(
                        u'Enter an absolute path to your SSL private key',
                        u'{SC_SSL_PRIVATE_KEY}',
                        required = True,
                        default_value = self.interaction.get_command_line_setting(u'{SC_SSL_PRIVATE_KEY}')
                        ),
                    ]
                    
                self.fields.extend(new_fields)
                
            self.fields.extend ([
                self.interaction.TextField(
                    u'Enter an absolute path for the server working directory', 
                    u'{SC_WORKSPACE_PATH}', 
                    required = True, 
                    default_value = self.interaction.get_command_line_setting(u'{SC_WORKSPACE_PATH}')
                    ),
                self.interaction.TextField(
                    u'Enter your HOOPS Communicator License Key', 
                    u'{LICENSE_KEY}', 
                    required = True, 
                    default_value = self.interaction.get_command_line_setting(u'{LICENSE_KEY}')
                    ),
                ]
            )
                
        elif current_index == PUBLIC_NAME_INDEX:
            if self.fields[USE_IP_ADDRESS_INDEX].boolean_value():
                #User wants to use IP addresses in URIs, so the public name isn't needed
                self.fields[self.index] = self.interaction.ConstantField(
                    u'Empty public name',
                    u'{PUBLIC_NAME}',
                    ''
                    )
            else:
                self.fields[self.index] = self.interaction.TextField(
                    u'Enter the network interface\'s public name. Note that the given default and/or examples might be incomplete or inaccurate, so be sure that you enter a valid value',
                    u'{PUBLIC_NAME}',
                    required = True,
                    default_value = self.interaction.get_command_line_setting(u'{PUBLIC_NAME}') or self.interaction.get_best_public_name(self.fields[BIND_TO_ADDRESS_INDEX].value)
                    )
        elif current_index == PUBLIC_IP_ADDRESS_INDEX:
            if self.fields[USE_IP_ADDRESS_INDEX].boolean_value():
                self.fields[self.index] = self.interaction.IpAddressField(
                    u'Enter the network interface\'s public IP address. Note that the given default and/or examples might be incomplete or inaccurate, so be sure that you enter a valid value',
                    u'{PUBLIC_IP_ADDRESS}',
                    required = True,
                    default_value = self.interaction.get_command_line_setting(u'{PUBLIC_IP_ADDRESS}') or self.interaction.get_best_public_ip_address(self.fields[BIND_TO_ADDRESS_INDEX].value)
                    )
            else:
                #User doesn't want to use IP addresses in URIs, so the public IP address isn't needed
                self.fields[self.index] = self.interaction.ConstantField(
                    u'Empty public IP address',
                    u'{PUBLIC_IP_ADDRESS}',
                    ''
                    )
        elif current_index == PUBLIC_NAME_OR_IP_ADDRESS_INDEX:
            if self.fields[USE_IP_ADDRESS_INDEX].boolean_value():
                self.fields[self.index] = self.interaction.ConstantField(
                    u'Public name or IP address (using IP address)',
                    u'{PUBLIC_NAME_OR_IP_ADDRESS}',
                    self.fields[PUBLIC_IP_ADDRESS_INDEX].value
                    )
            else:
                self.fields[self.index] = self.interaction.ConstantField(
                    u'Public name or IP address (using name)',
                    u'{PUBLIC_NAME_OR_IP_ADDRESS}',
                    self.fields[PUBLIC_NAME_INDEX].value
                    )

        #Go to next
        self.index += 1

        return self.fields[current_index]
        
    def filter_content(self, content):
        result = content
        
        if len(self.fields) >= SC_SERVER_SSL_CONFIGURE_INDEX and self.fields[SC_SERVER_SSL_CONFIGURE_INDEX].boolean_value() is False:
            result = self.cut_section(result, "ssl_configuration")
            
        return result
        
    def cut_section(self, content, section_name):
        while True:
            section_name_begin = "<!--" + section_name + "_begin-->"
            begin_index = content.find(section_name_begin)
            
            section_name_end = "<!--" + section_name + "_end-->"
            end_index = content.find(section_name_end)
            
            if begin_index == -1 or end_index == -1: #no sections to cut
                break;
            
            content = content[:begin_index] + content[end_index+len(section_name_end):]
        
        return content
        
def fields(interaction):
    return iter(Fields(interaction))

