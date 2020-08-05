import tempfile

display_name = u'Distributed Mode'

description = u'Configure a single viewing server for production use.'

extensions = (u'.xml', )

#Some default constants
SC_CSR_PROCESS_MANAGER_INSTANCES = 32
SC_SSR_PROCESS_MANAGER_INSTANCES = 10

FILE_SERVER_HOST_PORT = 11180
EVENT_LOG_HOST_PORT = 11181
SERVICE_BROKER_HOST_PORT = 11182
SC_CSR_PROCESS_MANAGER_HOST_PORT = 11183
SC_SSR_PROCESS_MANAGER_HOST_PORT = 11184

SC_CSR_HOST_BASE_PORT = 11000
SC_CSR_BASE_PORT = 11200

SC_SSR_HOST_BASE_PORT = 11100
SC_SSR_BASE_PORT = 11400

#Field indexes
BIND_TO_ADDRESS_INDEX = 0
USE_IP_ADDRESS_INDEX = 1
PUBLIC_NAME_INDEX = 2
PUBLIC_IP_ADDRESS_INDEX = 3
PUBLIC_NAME_OR_IP_ADDRESS_INDEX = 4
SC_CSR_PROCESS_MANAGER_INSTANCES_INDEX = 5
SC_SSR_PROCESS_MANAGER_INSTANCES_INDEX = 6

EVENT_LOG_HOST_PORT_INDEX = 8
SERVICE_BROKER_HOST_PORT_INDEX = 9
SC_SERVER_SSL_CONFIGURE_INDEX = 16
SC_SERVER_SSL_RESPONSE_INDEX = 17

#An iterable class containing all the fields
class Fields:
    def __init__(self, interaction):
        self.interaction = interaction
        self.filtered_files = []
        self.index = 0
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

            #Field 5 - SC_CSR_PROCESS_MANAGER_INSTANCES_INDEX
            self.interaction.IntegerField(
                u'Enter the number of stream cache CSR instances',
                u'{SC_CSR_PROCESS_MANAGER_INSTANCES}',
                min_value = 0,
                max_value = 512,
                required = True,
                default_value = self.interaction.get_command_line_setting(u'{SC_CSR_PROCESS_MANAGER_INSTANCES}') or SC_CSR_PROCESS_MANAGER_INSTANCES
                ),

            #Field 6 - SC_SSR_PROCESS_MANAGER_INSTANCES_INDEX
            self.interaction.IntegerField(
                u'Enter the number of stream cache SSR instances',
                u'{SC_SSR_PROCESS_MANAGER_INSTANCES}',
                min_value = 0,
                max_value = 512,
                required = True,
                default_value = self.interaction.get_command_line_setting(u'{SC_SSR_PROCESS_MANAGER_INSTANCES}') or SC_SSR_PROCESS_MANAGER_INSTANCES
                ),


            #Field 7
            self.interaction.PathField(
                u'Enter an absolute path to the log directory',
                u'{LOG_DIRECTORY}',
                required = True,
                default_value = self.interaction.complete_path(self.interaction.get_command_line_setting(u'{LOG_DIRECTORY}')) or self.interaction.complete_path(u'~/communicator_logs')
                ),

            #Field 8 - EVENT_LOG_HOST_PORT_INDEX
            self.interaction.ConstantField(
                u'Event log host port',
                u'{EVENT_LOG_HOST_PORT}',
                self.interaction.get_command_line_setting(u'{EVENT_LOG_HOST_PORT}') or EVENT_LOG_HOST_PORT
                ),

            #Field 9 - SERVICE_BROKER_HOST_PORT_INDEX
            self.interaction.ConstantField(
                u'Service broker host port',
                u'{SERVICE_BROKER_HOST_PORT}',
                self.interaction.get_command_line_setting(u'{SERVICE_BROKER_HOST_PORT}') or SERVICE_BROKER_HOST_PORT
                ),
            #Field 10
            self.interaction.ConstantField(
                u'Stream cache CSR process manager host port',
                u'{SC_CSR_PROCESS_MANAGER_HOST_PORT}',
                self.interaction.get_command_line_setting(u'{SC_CSR_PROCESS_MANAGER_HOST_PORT}') or SC_CSR_PROCESS_MANAGER_HOST_PORT
                ),

            #Field 11
            self.interaction.ConstantField(
                u'Stream cache CSR host base port',
                u'{SC_CSR_HOST_BASE_PORT}',
                self.interaction.get_command_line_setting(u'{SC_CSR_HOST_BASE_PORT}') or SC_CSR_HOST_BASE_PORT
                ),

            #Field 12
            self.interaction.ConstantField(
                u'Stream cache CSR base port',
                u'{SC_CSR_BASE_PORT}',
                self.interaction.get_command_line_setting(u'{SC_CSR_BASE_PORT}') or SC_CSR_BASE_PORT
                ),
            #Field 13
            self.interaction.ConstantField(
                u'Stream cache SSR process manager host port',
                u'{SC_SSR_PROCESS_MANAGER_HOST_PORT}',
                self.interaction.get_command_line_setting(u'{SC_SSR_PROCESS_MANAGER_HOST_PORT}') or SC_SSR_PROCESS_MANAGER_HOST_PORT
                ),

            #Field 14
            self.interaction.ConstantField(
                u'Stream cache SSR host base port',
                u'{SC_SSR_HOST_BASE_PORT}',
                self.interaction.get_command_line_setting(u'{SC_SSR_HOST_BASE_PORT}') or SC_SSR_HOST_BASE_PORT
                ),

            #Field 15
            self.interaction.ConstantField(
                u'Stream cache SSR base port',
                u'{SC_SSR_BASE_PORT}',
                self.interaction.get_command_line_setting(u'{SC_SSR_BASE_PORT}') or SC_SSR_BASE_PORT
                ),
                
            #Field 16 - SC_SERVER_SSL_CONFIGURE_INDEX
            self.interaction.BooleanField(
                u'Do you need to configure SSL?',
                u'{CONFIGURE_SSL}',
                required = True,
                default_value = self.interaction.get_command_line_setting(u'{CONFIGURE_SSL}') or u'no'
                ),
                
            #Field 17 - SC_SERVER_SSL_RESPONSE_INDEX
            self.interaction.ConstantField(
                u'SSL Response',
                u'{SSL_RESPONSE}',
                0
                ),
            ]

        #[Debug]self.interaction.print_line(u'Initialized {0} fields'.format(len(self.fields)))

    def __iter__(self):
        return self

    def __next__(self):
        #Python 3.x next
        return self.next()
    
    def next(self):
        #Python 2.x next
        if len(self.fields) <= self.index:
            raise StopIteration

        if self.index == PUBLIC_NAME_INDEX:
            if self.fields[USE_IP_ADDRESS_INDEX].boolean_value():
                #User wants to use IP addresses in URIs, so the public name isn't needed
                self.fields[self.index] = self.interaction.ConstantField(
                    u'Empty public name',
                    u'{PUBLIC_NAME}',
                    ''
                    )
            else:
                self.fields[self.index] = self.interaction.TextField(
                    u'Enter the network interface\'s public name. Please be sure to enter a valid value',
                    u'{PUBLIC_NAME}',
                    required = True,
                    default_value = self.interaction.get_command_line_setting(u'{PUBLIC_NAME}') or self.interaction.get_best_public_name(self.fields[BIND_TO_ADDRESS_INDEX].value)
                    )
        elif self.index == PUBLIC_IP_ADDRESS_INDEX:
            if self.fields[USE_IP_ADDRESS_INDEX].boolean_value():
                self.fields[self.index] = self.interaction.IpAddressField(
                    u'Enter the network interface\'s public IP address.  Please be sure to enter a valid value',
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
        elif self.index == PUBLIC_NAME_OR_IP_ADDRESS_INDEX:
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
        elif self.index == SERVICE_BROKER_HOST_PORT_INDEX:
            #[Debug]self.interaction.print_line(u'Begin optional field appends')
            if self.fields[SC_CSR_PROCESS_MANAGER_INSTANCES_INDEX].value == 0:
                self.filtered_files.append('viewer_csr.xml')

            if self.fields[SC_SSR_PROCESS_MANAGER_INSTANCES_INDEX].value == 0:
                self.filtered_files.append('viewer_ssr.xml')
                
        elif self.index == SC_SERVER_SSL_RESPONSE_INDEX:
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

            if self.fields[SC_CSR_PROCESS_MANAGER_INSTANCES_INDEX].value > 0 or  self.fields[SC_SSR_PROCESS_MANAGER_INSTANCES_INDEX].value > 0:
                new_fields = [
                    self.interaction.MultiplePathField(
                        u'Enter the path of a model search directory.',
                        u'<modelSearchDirectory>{SC_SERVER_MODEL_SEARCH_DIRECTORY}</modelSearchDirectory>',
                        u'{SC_SERVER_MODEL_SEARCH_DIRECTORY}',
                        minimum = 1,
                        maximum = None,
                        default_value = [self.interaction.complete_path(setting) for setting in self.interaction.get_command_line_setting(u'{SC_SERVER_MODEL_SEARCH_DIRECTORY}', None, [])]
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
    
        current_index = self.index
        self.index += 1
        #[Debug]self.interaction.print_line(u'Returning field {0} of {1} fields'.format(current_index, len(self.fields)))
        return self.fields[current_index]
        
    def filter_content(self, content):
        result = content
        
        if self.fields[SC_SERVER_SSL_CONFIGURE_INDEX].boolean_value() is False:
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

def finish(interaction, fields):
    pass
