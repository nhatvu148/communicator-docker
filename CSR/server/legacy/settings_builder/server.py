#!/usr/bin/env python

import http.server.HTTPServer as BaseHTTPServer
import http.server.CGIHTTPServer as CGIHTTPServer
import cgitb; cgitb.enable()

class Handler(CGIHTTPServer.CGIHTTPRequestHandler):
	cgi_directories = '/cgi'

httpd = BaseHTTPServer.HTTPServer(('', 9999), Handler)
httpd.serve_forever()
