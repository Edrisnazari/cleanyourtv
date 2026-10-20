# CleanYourTV — Samsung Legacy Smart TV Edition (2014 H-Series)

Custom TV experience designed for Samsung UA65HU7200W (Firmware 1290, Orsay / WebKit 537.42).

## What It Provides
- **Pitch-black OLED aesthetic** with subtle, dynamic time-of-day gradient (dawn, midday, dusk, night).
- **Large readable clock & date** formatted for 65" TV viewing from couch distance.
- **Live Geelong, Victoria Weather** (temperature, condition, humidity, wind, high/low) via local proxy.
- **PS5 Gaming Session Timer** with D-pad Start/Pause/Reset.
- **Quick Web Shortcuts & TV Status**.
- **Full D-pad Navigation** without requiring a mouse or pointer cursor.

---

## How to Test on Your TV

### Step 1: Start the Local Server on your Mac
In your terminal, run:
```bash
python3 samsung-legacy/server.py
```
This automatically packages the app into `CleanYourTV.zip`, generates `widgetlist.xml`, and starts an HTTP server on port 8000.

---

### Step 2A: Instant Preview via TV Web Browser (Route B)
1. On your TV remote, open the **Internet** (Web Browser) app.
2. In the URL bar, type:
   ```text
   http://<YOUR-MAC-IP>:8000/
   ```
   *(Your Mac's IP is shown in the terminal output, e.g. `http://192.168.1.107:8000/`)*
3. The dashboard will load in full screen!
4. **Tip:** Press `TOOLS` or add it to your browser **Bookmarks** for 1-click access.

---

### Step 2B: Install as Smart Hub App Tile (Route A)
1. On the TV remote, press **MENU** → **Smart Features** → **Samsung Account** → **Log In**.
2. Enter the built-in developer account ID:
   - **ID:** `develop`
   - **Password:** leave blank (or press Enter).
3. Open **Smart Hub** → navigate to the **Apps** panel.
4. Highlight any app tile and **hold the ENTER button** on the remote for 2 seconds until the menu pops up.
5. Select **IP Setting** → enter your Mac's IP address (e.g. `192.168.1.107`).
6. Hold **ENTER** on any app again → select **Start App Sync**.
7. The TV will display *"Installing new service: CleanYourTV"*.
8. You now have a permanent **CleanYourTV** app tile in your Smart Hub!

---

### Navigation Controls
- **Arrow Keys (◄ ► ▲ ▼):** Move focus smoothly across cards.
- **ENTER:** Activate focused card (Start/Pause timer, refresh weather, open shortcut).
- **RETURN / BACK:** Reset focus to the main view.
- **EXIT:** Return to TV / HDMI.

### Rollback / Uninstall
To remove the widget from your TV: in Smart Hub Apps, hold **ENTER** on the **CleanYourTV** tile and select **Delete**.
