#!/usr/bin/python

import socket
import SimpleHTTPServer
import SocketServer
import webbrowser
import subprocess

PORT = 8000
serve = False

try:
    Handler = SimpleHTTPServer.SimpleHTTPRequestHandler

    httpd = SocketServer.TCPServer(("", PORT), Handler)

    print("Flotilla Rockpool running on http://127.0.0.1:{port}".format(port=PORT))
    serve = True
except socket.error:
    print("Flotilla Rockpool already running on http://127.0.0.1:{port}".format(port=PORT))


print("Launching Browser")
try:
    subprocess.Popen(["chromium-browser", "http://127.0.0.1:{port}".format(port=PORT)])
except IOError:
    webbrowser.open("http://127.0.0.1:{port}".format(port=PORT), new=1, autoraise=True)

if serve:
    httpd.serve_forever()
