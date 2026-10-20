#!/usr/bin/env python3
"""
CleanYourTV — Samsung Legacy Smart TV Server & App Sync Packager
Compatible with:
- Route B: Direct TV Web Browser (http://<mac-ip>:8000)
- Route A: Smart Hub "User App Sync" (http://<mac-ip>:8000/widgetlist.xml)
"""

import http.server
import json
import os
import socket
import sys
import time
import urllib.request
import zipfile

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.join(BASE_DIR, "app")
WIDGET_DIR = os.path.join(BASE_DIR, "widget")
ZIP_PATH = os.path.join(WIDGET_DIR, "CleanYourTV.zip")
XML_PATH = os.path.join(BASE_DIR, "widgetlist.xml")

# Cached Weather (Geelong, VIC: -38.15, 144.36)
weather_cache = {"timestamp": 0, "data": None}


def get_local_ip():
    """Detect the Mac's primary local LAN IP address."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Does not actually send data over network
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


def build_widget_package(local_ip):
    """Zips the app/ folder and creates widgetlist.xml for Samsung Smart Hub Sync."""
    os.makedirs(WIDGET_DIR, exist_ok=True)

    # 1. Create CleanYourTV.zip
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(APP_DIR):
            for file in files:
                if file.startswith(".") or file.endswith("~"):
                    continue
                file_path = os.path.join(root, file)
                archive_name = os.path.relpath(file_path, APP_DIR)
                zf.write(file_path, archive_name)

    zip_size = os.path.getsize(ZIP_PATH)

    # 2. Create widgetlist.xml
    xml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<rsp stat="ok">
    <list>
        <widget id="CleanYourTV">
            <title>CleanYourTV</title>
            <compression size="{zip_size}" type="zip"/>
            <description>CleanYourTV Dashboard</description>
            <download>http://{local_ip}:{PORT}/widget/CleanYourTV.zip</download>
        </widget>
    </list>
</rsp>
"""
    with open(XML_PATH, "w", encoding="utf-8") as f:
        f.write(xml_content)

    print(f"[Build] Packaged CleanYourTV.zip ({zip_size} bytes)")
    print(f"[Build] Generated widgetlist.xml")


def get_geelong_weather():
    """Fetch and cache live weather from Open-Meteo for Geelong, Victoria."""
    global weather_cache
    now = time.time()
    # Cache for 10 minutes
    if weather_cache["data"] and (now - weather_cache["timestamp"] < 600):
        return weather_cache["data"]

    url = (
        "https://api.open-meteo.com/v1/forecast?"
        "latitude=-38.15&longitude=144.36&"
        "current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&"
        "daily=temperature_2m_max,temperature_2m_min&timezone=Australia%2FMelbourne"
    )
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "CleanYourTV-Legacy/1.0"})
        with urllib.request.urlopen(req, timeout=4) as response:
            data = json.loads(response.read().decode("utf-8"))
            weather_cache["data"] = data
            weather_cache["timestamp"] = now
            return data
    except Exception as e:
        print(f"[Weather] Upstream fetch notice: {e}")
        # Return fallback if network is unreachable
        return {
            "current": {
                "temperature_2m": 18.5,
                "apparent_temperature": 18.0,
                "relative_humidity_2m": 65,
                "wind_speed_10m": 15,
                "weather_code": 2,
            },
            "daily": {
                "temperature_2m_max": [22.0],
                "temperature_2m_min": [13.0],
            },
        }


class SmartTVHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Serve /widgetlist.xml from BASE_DIR
        if path == "/widgetlist.xml":
            return XML_PATH
        # Serve /widget/ from WIDGET_DIR
        elif path.startswith("/widget/"):
            rel = path[len("/widget/") :]
            return os.path.join(WIDGET_DIR, rel)
        # All other files (index.html, css, js, icons) served from APP_DIR
        else:
            clean_path = path.lstrip("/")
            if not clean_path or clean_path == "":
                clean_path = "index.html"
            return os.path.join(APP_DIR, clean_path)

    def do_GET(self):
        # Graceful stub for $MANAGER_WIDGET scripts during browser preview
        if "$MANAGER_WIDGET" in self.path:
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript")
            self.end_headers()
            self.wfile.write(b"/* Stub for TV browser preview mode */")
            return

        # Weather API Proxy (avoids HTTPS root cert failures on 2014 TV WebKit)
        if self.path.startswith("/api/weather"):
            weather = get_geelong_weather()
            payload = json.dumps(weather).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        super().do_GET()

    def log_message(self, format, *args):
        # Format clean log messages
        sys.stdout.write(f"[HTTP] {self.address_string()} - {args[0]} {args[1]}\n")
        sys.stdout.flush()


def run_server():
    local_ip = get_local_ip()
    build_widget_package(local_ip)

    server_address = ("0.0.0.0", PORT)
    httpd = http.server.HTTPServer(server_address, SmartTVHandler)

    print("\n" + "=" * 65)
    print("  CleanYourTV — Samsung Legacy Smart TV Server Running")
    print("=" * 65)
    print(f" Local Mac IP:     {local_ip}")
    print(f" Server Port:      {PORT}")
    print("-" * 65)
    print(" ROUTE B (TV Web Browser Instant Preview):")
    print(f"   1. On your Samsung TV, open the 'Internet' Web Browser.")
    print(f"   2. Enter URL: http://{local_ip}:{PORT}/")
    print(f"   3. Bookmark it to your browser home page for 1-click access.")
    print("-" * 65)
    print(" ROUTE A (Smart Hub 'User App Sync' Install):")
    print("   1. Remote MENU -> Smart Features -> Samsung Account -> Log In.")
    print("   2. Enter account ID: develop  (leave password blank).")
    print("   3. In Smart Hub Apps, hold ENTER on any app -> select 'IP Setting'.")
    print(f"   4. Enter your Mac IP: {local_ip}")
    print("   5. Hold ENTER again -> select 'Start App Sync'.")
    print("   6. TV will install 'CleanYourTV' as an app tile in Smart Hub!")
    print("=" * 65)
    print("Press Ctrl+C to stop server.\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Server] Shutting down.")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
