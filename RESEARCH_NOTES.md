# Research notes — Samsung / Tizen feasibility for a "clean your TV" build

Prepared for Edris on **2026-10-20**. All sources were accessed on **2026-10-20** unless stated
otherwise. Claims are graded:

- **[A] Verified platform capability** — backed by official Samsung/Tizen documentation.
- **[B] Community report with reproducible code or steps** — a public repo, official doc procedure, or
  a published instruction set someone else can follow.
- **[C] Unverified social-media claim** — a post, reply or showcase caption with no published code,
  no measurement, and no way to check it.

> Nothing in this file should be read as "the TV OS was replaced". In every case the operating
> system was left alone; what changed was the **home screen** (and, on Android TV, some preloaded
> apps being disabled). Performance numbers quoted by posters are **their own impressions**, not
> measurements.

---

## 0. The single most important finding

The upstream project itself states that it does not work on a Samsung.

> `PROMPT.md` line 5 — *"Works on Android TV / Google TV sets (Xiaomi, TCL, Hisense, Sony, OnePlus,
> Realme, Nvidia Shield and most others). **It will not work on Samsung Tizen, LG webOS or Fire TV.**"*

> `README.md` lines 117–118 — *"Anything running **Android TV** or **Google TV**. **Samsung (Tizen)**
> and LG (webOS) run different systems; see SHOWCASE.md for a webOS port. **Fire TV** takes the
> debloat half only, since Fire OS will not hand Home to a third-party launcher."*

Verified in the clone at commit `09fe4e40`:

- `grep -rniE "samsung|tizen|\bsdb\b|webos"` across the whole repo returns **exactly two** upstream
  mentions of Samsung/Tizen — the two quotes above — plus one webOS row in `SHOWCASE.md`
  (the LG port by @OmkarK97).
- `examples/` contains **93 device folders and not one Samsung, Tizen or Freestyle entry**. Verified
  brand breakdown: TCL 18, Sony 16, Xiaomi 15, Philips 6, Hisense 5, then Skyworth/Panasonic/
  NVIDIA/Hitachi/Haier/CHiQ/BenQ 2 each, and 19 brands with one each (Amazon Fire TV Stick,
  Google Chromecast, Insignia, JMGO, Kalley, OnePlus, onn, Portronics, PRISM+, RCA, Redmi, SANYO,
  Stellamore, Thomson, Toshiba Fire TV, Vu, Wanbo, XGIMI, AiPro2K).
- `tools/` contains **no `sdb` code at all**. `tools/tv.py` is an ADB-over-TCP client built on the
  pure-Python `adb-shell` package. `tools/disable.sh` drives `pm disable-user --user 0`, an Android
  package-manager command with no Tizen equivalent.

**Conclusion:** the Android launcher in `launcher/` cannot run on a Samsung Tizen TV. It is an
Android APK (`applicationId 'com.gathin.tvhome'`, `compileSdk 34`, `minSdk 26`). Samsung TVs do not
install APKs.

---

## 1. Which platform is Edris's Samsung actually running?

### 1.0 Confirmed TV Model & Platform Finding (Updated 2026-10-20 by Antigravity) — [A]

Edris has confirmed the exact television hardware details:
- **Model:** Samsung UA65HU7200W
- **Full Australian Model Code:** `UA65HU7200WXXY`
- **Type:** `UA65HU7200`
- **Hardware Version:** `TH01`
- **Rear Label Power Specification:** Mentions a power rating *"including UHD Evolution Kit"*.
- **Model Year / Lineage:** 2014 H-Series Ultra HD (UHD) Curved TV.

**Platform Identity:**
- In its factory internal configuration, this television runs Samsung's **pre-Tizen Legacy Smart TV platform** (Orsay, Linux 2.6 kernel, WebKit/Maple browser engine, JavaScriptCore/V8 runtime).
- It does **not** run modern Tizen out-of-the-box.
- **Evolution Kit Status:** The rear label text is an electrical rating specification indicating that the TV's power supply can power an optional add-on Evolution Kit (such as the SEK-3500U or SEK-2500U) plugged into the One Connect port. It does **not** indicate a kit is currently installed.
  - If a **SEK-3500U** is physically attached, the TV's smart platform is replaced by Tizen 2.4 (2015 OS) and adds HDMI 2.0 / HDCP 2.2.
  - If **no** Evolution Kit is attached, the TV remains 100% on the 2014 Samsung Legacy Platform.
- **Firmware Family:** For the base UA65HU7200W, Samsung's official firmware family is `T-NT14U...` (Novatek NT14U UHD platform, latest official release `1280.0` / `T-NT14UUABC.exe`).

---

### 1.1 Samsung's own platform table — [A]

Samsung's official **TV Model Groups** table maps every consumer TV product year to a platform:

<https://developer.samsung.com/smarttv/develop/specifications/tv-model-groups.html> (accessed 2026-10-20)

| Year | Platform (Samsung's own words) | Example model names in the table |
|---|---|---|
| 2026 | **Tizen 10.0** | QN90H, S95H, QN990H, U8500H, M70H … |
| 2025 | **Tizen 9.0** | QN95F, QN90F, M90F, QN80F, U8000F … |
| 2024 | **Tizen 8.0** | G80SD, QN900D, QN85D, QN80D, DU7700, F6000D … |
| 2023 | **Tizen 7.0** | QCQ900, G85NC, S90PC, M80C … |
| 2022 | **Tizen 6.5** | QBQ900, G85NB, M80B, UAU8500 … |
| 2021 | **Tizen 6.0** | QAQ9X, QAQ900, QAQ850 … |
| 2020 | Tizen 5.5 | QTQ800, LSR9 … |
| 2019 | Tizen 5.0 | QRQ900B … |
| 2018 | Tizen 4.0 | QRQ900 … |
| 2017 | Tizen 3.0 | QMS9Y … |
| 2016 | Tizen 2.4 | UKU9518 … |
| 2015 | **mixed**: Tizen 2.3 (premium) *and* Samsung Legacy Platform (entry) | UJS9900 (Tizen 2.3), UK5200 (Legacy) |
| 2014 and earlier | **Samsung Legacy Platform** (pre-Tizen) | UHU9800, UF8500 … |

**There is no Google TV and no Android TV row anywhere in this table.** For a Samsung television,
Samsung's own developer portal lists only Tizen and the pre-2015 Legacy Platform.

> **Correction worth recording:** the obvious thing to guess is that Samsung has started shipping
> Google TV on newer sets. **No evidence for that was found.** Samsung's 2026 models are getting
> **Google Cast** — which is a casting protocol, *not* an operating system. It gives no APK runtime,
> no `pm`, no `CATEGORY_HOME`. Samsung's own platform matrix contains no Google TV entry for any
> model group 2015–2026, and no Samsung announcement of Google TV on consumer hardware was found.
> Treat "Samsung TV runs Tizen" as the working assumption — **but still read the model off the TV**,
> because the cost of being wrong is a wasted toolchain.
>
> Also note **One UI Tizen is a rebrand, not a new platform.** The consumer site uses the name and
> ships a redesigned "One UI Tizen Home" for 2026, but Samsung's developer docs still number the
> platform Tizen 9.0 / 10.0. There is no "Tizen 8 / webOS-like" thing to target — Tizen 8.0 *is*
> the 2024 model year.

### 1.2 The Samsung Freestyle example (a projector, not a TV)

The showcase entry the task refers to is @pranavrajs's post about a **Samsung Freestyle portable
projector**. The post text was retrieved in full:

<https://x.com/pranavrajs/status/2112018629697093737> (accessed 2026-10-20)

> "I did not realize you could do this over ADB. **Samsung has SDB (similar to adb), works over Wifi.**
> I have a Samsung Freestyle projector that I use quite often. It has always been painfully slow, and
> I assumed it was the hardware. Gave Opus 5.5 the task of speeding it up, but it refused, citing
> cybersecurity concerns and downgraded to 4.8, and it still refused. Tried Astra instead. **It could
> not remove the bloatware, so it built a custom launcher, replaced the default one, and disabled a
> bunch of unnecessary apps.** Now the entire thing boots up in 1 second. 🤯"

Replies visible on that post, still unanswered in the captured thread:

- @ZaharovAndrew (Oct 19): *"People seem to be pushing toward Apple TV aesthetics and design…"*
- @imbibingnoob (Oct 19): *"Wait, how did it get through the Tizen OS?"*
- @KevinDBlood (Oct 19): *"samsung tizenOS na? is it possible to replace the launcher with a custom
  one? how did you bypass the security?"*

**The Samsung Freestyle runs Tizen** — confirmed independently by Samsung's own 2022 product-spec
sheet (`images.samsung.com/is/content/samsung/assets/au/tvs/product-specs/the-freestyle-2022-product-specs.pdf`),
and by RTINGS' Freestyle 2nd Gen review, ZDNET and ProjectorReviews, all of which describe it as
running "Samsung's Tizen OS". [A]

**Grading of the Freestyle claim: [C] — and the published evidence actually contradicts it.**

Two independent checks were run on the image the project itself publishes for this entry. The
website serves it from
`https://cdn.jsdelivr.net/gh/Gathin23/cleanyourtv-website@main/public/results/pranavrajs.jpg`, and
the card is captioned as a "before and after" tile.

**I downloaded that image and looked at it.** It is a **single 960×540 screenshot of the stock
Samsung One UI Tizen home screen**:

- a **"Sponsored"** label in the top-right corner,
- a large **Paramount+ "Tulsa King" hero ad** filling the background,
- the Tizen tab bar **"For You | Live | Apps"** with **Apps** selected,
- the left vertical rail (Home, Search),
- a **"Recommended"** row: peacock, sling, ESPN, Samsung Health, Browser, Instagram, Samsung
  GameHub & Apps, Glance+,
- a **"Provided by Samsung"** row: Gallery, **Samsung Promotion**,
- an **"Editor's Choice"** row: Train your brain with Samsung, AMC+ Entertainment, Samsung TV Plus,
  Apple TV, Instagram, Crunchyroll.

**No custom launcher is visible.** There is no "after" state, and no separate after-image in the
site's asset set (`pranavrajs-2`, `pranavrajs_2`, `pranavrajs-after`, `pranavrajs2` all 404). The
website's illustration of the "Samsung Freestyle" result is a picture of the **ad-laden stock Tizen
home** — i.e. the "before" of the problem, not a custom dashboard.

Why this matters:

1. **The claimed "custom launcher" is not published** — not as an image, not as code, not as steps.
2. The one artefact the project chose to publish for this entry shows the **stock shell**.
3. The device is a **projector running Tizen**, so the Android APK launcher from this repo is
   categorically incapable of running on it. Whatever was built there was **not** this repo's
   launcher.
4. "It could not remove the bloatware" is consistent with Samsung's own documentation (§2.3 below:
   preinstalled applications cannot be removed).
5. "boots up in 1 second" and "replaced the default one" are **unmeasured, unreplicated claims**.
   "Replaced the default one" most plausibly means a home-screen app was set as the launch point,
   **not** that One UI Tizen was replaced.
6. The two people asking "how did it get through the Tizen OS?" and "how did you bypass the
   security?" received **no visible answer**. Treat the method as unknown.

**Do not plan around this example.** It is not reproducible from public material, and the only
artefact published for it shows the stock home screen.

### 1.3 The main tweet — [A] for the text, [C] for the headline numbers

<https://x.com/gathint/status/2111379569030939102> (accessed 2026-10-20)

> "Vibe coded my parents' TV this afternoon! It was showing a sponsored ad before you could even get
> to Netflix. Gave Claude Code the model number, it found the TV on wifi, **removed 25 Xiaomi
> packages and wrote a new launcher**. Looks like an Apple TV now lol."

Dated 8:51 AM, Oct 17, 2026 by @gathint (Sr. DevRel @0G_labs, cleanyour.tv). The post links the repo
and says *"Prompt, launcher source and the gotchas I hit are all here… works on any Android TV /
Google TV, everything is reversible"*.

- **The device is a Xiaomi TV running Android TV / Google TV** — i.e. exactly the platform this repo
  supports. `pm disable-user` and an Android APK launcher are the correct tools there.
- The "25 Xiaomi packages" figure is consistent with the repo's Xiaomi example lists.
- Engagement figures on the website (30,700 likes · 767 replies at the time of capture) are the
  website's numbers, not a technical claim.
- The website's own "LATEST" strip says *"92 TVs from 31 brands"*; the repository README says
  *"93 TV models · 31 brands"* and `examples/` contains **93** folders (verified locally). Treat 93
  as the current repository state.

### 1.4 X search page — inaccessible

<https://x.com/search?q=tv&src=typed_query> returned only the bare shell page ("X - The Everything
App / X") with **no results** — the search view is login-gated. Individual **public post URLs are
fetchable without an account**, which is how the two posts above were read. No authentication was
bypassed and no post that could not be retrieved is reported as read. [A for the access limitation]

### 1.5 The website showcase — [A] that it exists, [C] for most of it

<https://cleanyour.tv/> (accessed 2026-10-20). It lists ~60 "on air" cards. Every one is a
screenshot plus a link to an X post. **There is no code attached to any of them.** The card captions
are terse labels such as "Samsung Freestyle", "Java launcher + mascot", "PS5-style launcher",
"Own TV OS, 3D model", "Own launcher, Apple UI".

Brands appearing on the site: Xiaomi, TCL, LG (webOS), Sony, Hisense, Fire TV, Google TV, Acer,
OnePlus, Sansui, Redmi, Nintendo-ish retro console, projector models, and Samsung Freestyle. There
is **no Samsung TV** example on the site — only the Freestyle projector.

---

## 2. Samsung Tizen — what is actually possible

All of §2 is from Samsung's own developer documentation.

### 2.1 Installing a third-party app on a retail Samsung TV — [A]

Samsung, **Application Installation Q&A**:
<https://developer.samsung.com/smarttv/develop/faq/application-installation.html> (accessed 2026-10-20)

> **Q1. Can I install my application on a TV through USB?**
> "For security reasons, **'.wgt' application package files cannot be installed on a TV through USB.**
> However, you can use the **USB Demo Packaging Tool**, which allows you to create a **'.tmg'** package
> and license file that can be installed on a TV using a USB removable drive. The USB Demo Packaging
> Tool is available in the **Samsung Apps TV Seller Office**."

> **Q2. Can I install an application through USB, and have it launch automatically when the TV is
> switched on?**
> "**Not only consumer Samsung TVs but also hotel TVs do not support automatic launching for
> applications installed through USB.**"

> **Q4. Can I remove a preinstalled application from the TV?**
> "**No. Preinstalled applications cannot be removed.**"

Consequences, all [A]:

1. The installable artefact on a Samsung TV is a **Tizen `.wgt` / `.tmg` package**, not an APK. The
   `cleanyourtv` launcher cannot be repackaged into one — it is a native Android app, not a web app.
2. USB sideloading requires a **Samsung account / Seller Office access** to get the Demo Packaging
   Tool, and a licence file.
3. **No autostart.** Even after a successful install, the app cannot be made to launch when the TV
   powers on via a USB-installed package. So it cannot become "the thing that boots".
4. **Preinstalled Samsung apps cannot be removed.** The de-bloat half of `cleanyourtv`
   (`pm disable-user` on manufacturer telemetry, ad services, recommendation rows) **has no Tizen
   equivalent** on a consumer Samsung TV. This matches the Freestyle poster's own report that the
   bloatware could not be removed.

### 2.2 Developer mode and `sdb` — [A] that the tool exists; [C] for its practical limits

Samsung's **Command Line Interface** documentation describes `sdb` as the Tizen counterpart to
`adb`, with the caveat:

> "Only '.wgt' files can be installed on a TV."

<https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/command-line-interface.html>

The canonical first-party spec (now reachable only via the `Samsung/tizen-docs` GitHub repo, because
`docs.tizen.org` redirects to a JavaScript SPA that renders empty to a plain fetcher):

<https://github.com/Samsung/tizen-docs/blob/master/docs/sdk-tools/baseline-sdk/common-tools/smart-development-bridge.md>

> "The **Smart Development Bridge (SDB)** is a command line tool that communicates with a connected
> target device (it can be an emulator instance or a **real Tizen device**)… supplies basic commands
> for application development, such as file transfer, remote shell command, port forwarding for a
> debugger, viewing, filtering, and controlling target log output."

Concrete facts:

- Client → server (on your PC) → daemon (a background process on the TV). Ships in
  `$<TIZEN_SDK>/tools/`.
- Works over **USB or Wi-Fi**. `sdb connect <host>` defaults to **TCP port 26101** (not 5555).
- Requires **USB debugging / developer mode** on the target.
- Documented commands: `devices`, `connect`, `disconnect`, `push`, `pull`, `shell`, **`install
  <pkg-file>`** (pushes a `.tpk` and installs it), **`uninstall <pkg-id>`**, `forward`, `dlog`,
  `start-server`, `kill-server`, `get-state`, `get-serialno`, `status-window`, **`root <on|off>`**
  (root vs developer-account mode), `version`, `help`.
- The permitted `sdb shell` builtins are a short list: `ls, rm, mv, cd, cp, mkdir, touch, echo, tar,
  grep, cat, chmod, rpm, find, uname, netstat`.
- `sdb uninstall` takes a **10-character `pkg-id`** (e.g. `ko983dw33q`), *not* a dotted package name
  like `com.miui.tv.analytics`. **The repo's entire data model — lists of dotted package names — does
  not map over**; a name→id resolution step would be required.

**What this means for `cleanyourtv`:**

| `tools/` capability | Android TV (ADB) | Samsung Tizen (SDB) |
|---|---|---|
| `tools/tv.py` — run an arbitrary shell command | `AdbDeviceTcp` + `pm`/`dumpsys`/`am`/`settings` | **No equivalent.** `sdb shell` is a 16-command builtin set plus a vendor `vd_*` namespace — not a POSIX shell. No `pm`, `am`, `dumpsys`, `screencap`, `input keyevent` or `settings put`. |
| `tools/disable.sh` — `pm disable-user --user 0 <pkg>` | Yes | **No.** No documented per-app disable; preinstalled apps cannot be removed. |
| `tools/restore.sh` — replay a recorded state record | Yes | **No.** No record to replay. |
| `tools/b64push.py` — push an APK over base64 | Yes | Only signed `.tpk`/`.wgt`/`.tmg`. |
| `tools/theme.sh` — push a theme, restart Home | Yes (launcher re-reads `config.json` on start) | A Tizen app would need its own config format and its own restart path. |
| `launcher/build-and-install.sh` — build APK, install, `set-home-activity` | Yes | **No.** No `HOME` intent, no `set-home-activity`. |
| `tools/tv.py 'input keyevent …; screencap -p …'` — the verify loop | Yes | **Partial.** `sdb shell 0 debug <pkg-id>` returns a debug port, then `sdb forward tcp:<port> tcp:<port>` lets Chrome DevTools attach to the Tizen web app. See §4.5. |

**`tools/tv.py` would simply fail on a Samsung.** Its first act is `AdbDeviceTcp(HOST, 5555)` — an
Android ADB handshake with RSA `adbkey` auth. A Tizen TV does not speak ADB, on any port.

> **Naming trap:** there is **no "TV Extensions Installer"** in Samsung's tooling. Repeated
> exact-phrase searches returned zero results. What exists under a similar name is the **"TV
> Extension"** — the *SDK/manifest API level* (e.g. "TV Extension 10.0 or higher" in the model-group
> table), not an on-TV installer. The real mechanisms are **developer mode + Tizen Studio/SDB push of
> a `.tpk`**, or the **USB Demo Packaging Tool** `.tmg` route.

### 2.3 Can a third-party Tizen app become the TV's Home screen? — [A] No

Evidence, in order of strength:

1. **No HOME concept exists in the Tizen manifest model.** [A] Samsung's
   [Configuring TV Applications](https://developer.samsung.com/smarttv/develop/guides/fundamentals/configuring-tv-applications.html)
   lists the complete set of TV-specific `<tizen:metadata>` keys:

   | Key | Purpose |
   |---|---|
   | `http://samsung.com/tv/metadata/prelaunch.support` | Enable/disable **prelaunching** (app started in the background at TV power-on so it opens instantly) |
   | `http://samsung.com/tv/metadata/use.preview` | **Smart Hub Preview** |
   | `http://samsung.com/tv/metadata/use.network` | Network check on launch |
   | `http://samsung.com/tv/metadata/auto.update` | Auto-update |
   | `http://samsung.com/tv/metadata/force.update` | Force update (Tizen 2.3–2.4 only) |
   | `http://samsung.com/tv/metadata/gamepad` | Gamepad model requirement |
   | `http://samsung.com/tv/metadata/use.voiceguide` | Voice guide |

   **There is no `home`, `launcher`, `default_app` or `CATEGORY_HOME` equivalent — anywhere.**
   Contrast the launcher in this repo, which registers `android.intent.category.HOME` at
   `launcher/app/src/main/AndroidManifest.xml:56`. That is a concept Tizen simply does not have.
2. **The only sanctioned home-surface is Smart Hub Preview.** [A] A tile/section feed rendered
   *inside* Samsung's hub — up to 40 tiles per section, each with a deep-link URL and a PNG/JPG
   thumbnail (250 px tall, ≤360 KB, aspect ratios 16:9 / 4:3 / 1:1 / 2:3). Samsung's own wording:
   *"The preview must not be used to display third-party advertising or to advertise application
   features or capabilities."* See
   <https://developer.samsung.com/smarttv/develop/guides/smart-hub-preview/smart-hub-preview.html>
3. **The shell is firmware, and preinstalled apps cannot be removed.** [A] — Samsung's Q4 above.
   The One UI Tizen home screen is part of that preinstalled set.
4. **No autostart for USB-installed apps.** [A] — Samsung's Q2 above. Even a hand-built Tizen app
   does not take over the power-on path. (Prelaunching is the closest sanctioned thing, and it starts
   the app in the **background** — it does not own the Home button.)
5. **The remote's Home key is firmware-controlled.** [A] by architecture: the TV key is handled by
   the system shell before any app sees it. A third-party site states it plainly:
   *"This is generally not supported on Samsung TVs. The Tizen OS launcher is deeply integrated into
   the system, and there is typically no option to replace it with a third-party launcher."*
   (clrn.org — third-party, but fully consistent with 1–4.)
6. The upstream project reaches the same conclusion for other platforms it cannot own: *"Fire TV
   takes the debloat half only, since Fire OS will not hand Home to a third-party launcher."*
   And the SHOWCASE table shows how the community worked around Fire OS: an **accessibility service
   or a separate device** that brings the launcher up over Amazon's home, not a replacement of it.

### 2.4 What IS genuinely possible on a Tizen TV — [A]

- Build a **Tizen TV web app** (HTML5/CSS/JS) with **Tizen Studio**, targeting `tv` / `tv-samsung`
  profiles, and a **Tizen Studio certificate** (`.p12`).
- Install it on the TV over **Developer Mode + `sdb`**, or via a `.tmg` USB package.
- It appears in the TV's **Apps** row / Smart Hub and can be launched.
- It can handle **remote key events** (`TV remote control` API, documented under
  *User Interaction → Remote Control*), draw a custom dashboard, hold **local storage**, and read
  platform info via the **ProductInfo API** (`getModel()`, etc.).
- It can **prelaunch** — started in the background at power-on via
  `http://samsung.com/tv/metadata/prelaunch.support` — so it opens instantly. Note this is *not* the
  same as auto-launch for USB installs, which Samsung explicitly does not support (Q2), and it still
  does not own the Home button.
- It can publish a **Smart Hub Preview** section: tiles inside Samsung's own hub, each deep-linking
  into your app. This is the *only sanctioned* way to put your own content on Samsung's home
  surface.
- It can be set as the **default app for a URL/stream type** and can be pinned in the Apps row.

**That is a genuine "custom dashboard" — not a replacement Home screen.**

### 2.4b Tizen's package model — the deepest structural mismatch — [A]

Samsung's own Tizen package-manager API
(<https://github.com/Samsung/tizen-docs/blob/master/docs/application/native/guides/app-management/package-manager.md>)
exposes `package_info_is_system_package()`, `package_info_is_preload_package()`,
`package_info_is_removable_package()`, `package_info_is_accessible()`,
`package_info_get_installed_storage()`, `package_info_get_root_path()`, install/uninstall/update
events, and the read privilege `http://tizen.org/privilege/packagemanager.info`.

Two things follow:

1. **The unit of distribution is a signed bundle**: `.tpk` (Seller Office), `.wgt` (Tizen Studio),
   `.tmg` (USB Demo Packaging Tool). Not an APK.
2. **There is no `pm disable-user --user 0` equivalent.** That single command is the mechanism the
   *entire* `cleanyourtv` safety story rests on — `CONTRIBUTING.md` states *"Never list packages to
   uninstall. Everything in this repo disables with `pm disable-user`, which is reversible from the
   TV's own settings if the tools are gone."* On Tizen the nearest equivalents are
   `sdb uninstall <pkg-id>` (kills the app; official Q3: **all app data is deleted and cannot be
   recovered**) and the undocumented `sdb shell 0 vd_appuninstall <APPID>` (§4.5).
   **Preinstalled apps cannot be removed at all** (Q4).

### 2.5 Samsung's newer platform note

Samsung's consumer site (accessed 2026-10-20) describes **"One UI Tizen"** with a redesigned
**"One UI Tizen Home"** for 2026, on Tizen 10.0 per the model-group table. Also visible in the
developer portal navigation: a **TOAST** framework and a **CAPH 3.0** extension, plus a **Tizen
Legacy Platform** migration path. None of these changes the conclusion above — they are Tizen
successors, still not Android, still with a firmware-owned shell.

---

## 3. Three different things people call "custom TV OS"

This distinction matters and is easy to get wrong.

### (a) A Tizen app / dashboard
- **What it is:** a `.wgt` web app installed via `sdb` or USB, launched from the TV's Apps row.
- **Home button:** still opens Samsung's One UI Tizen home.
- **Boot behaviour:** does not auto-launch (USB installs cannot, per Q2).
- **Bloat:** untouched — preinstalled apps cannot be removed (Q4).
- **Achievable:** yes, with Tizen Studio + a certificate + Developer Mode on the TV.
- **This is the realistic Samsung deliverable.**

### (b) A replacement system Home screen
- **What it is:** the app becomes what the TV shows when you press Home / when the TV boots.
- **On Android TV / Google TV:** achievable, and exactly what `cleanyourtv` does via
  `cmd package set-home-activity` + disabling the stock launcher (see
  `launcher/build-and-install.sh`, which even has a rollback path if Home lands somewhere else).
- **On Samsung Tizen:** **not achievable** by any third party, by the reasoning in §2.3.
- **On Fire OS:** not achievable — hence the accessibility-service workarounds in the showcase.

### (c) An external Android/Google TV device
- **What it is:** a separate box (Chromecast with Google TV, Fire TV Stick, NVIDIA Shield, Xiaomi
  Mi Box) plugged into the Samsung's HDMI. The TV becomes a dumb display.
- **Achievable:** trivially, and the entire `cleanyourtv` project applies to the box, unmodified.
- **Trade-off:** you lose the Samsung tuner, HDMI-CEC, the Samsung remote's TV/power buttons (mostly),
  and the "one remote" feel. You gain the full Android/Google TV app ecosystem and total control.
- **The showcase has several of these** (onn, Chromecast with Google TV, Insignia Fire TV, Amazon
  Fire TV Stick, Wanbo X5 Pro's built-in Google TV stick, Mi Box S).

**Note the phrase "rebuilt my TV OS"** (used by several showcase posters, e.g. @srepdor "Own TV OS,
3D model", @internetartsy "Own launcher, Apple UI"). In every such case the operating system was
**not** replaced. What was replaced was the **home screen**. On an Android TV, that means
`pm disable-user` on the stock launcher plus `set-home-activity`. Nothing was reflashed, no ROM was
written, and no boot chain was touched.

---

## 4. Community examples — how reproducible are they?

### 4.1 The repo's own showcase (SHOWCASE.md) — [B], the strongest set

The upstream repo's `SHOWCASE.md` contains **exactly 18 table rows** (verified:
`grep -c "^| \[" SHOWCASE.md` → 18; the README badge also says "18 built on it"). **One** of them is a
platform port; the rest are Android TV forks, restyles and add-ons. **No Samsung/Tizen row.**

| Project | Platform | Built on | Reproducible? |
|---|---|---|---|
| [webOS launcher](https://github.com/OmkarK97/webos-vibehack) | **LG webOS web app** | LG OLED C6, webOS 26 | **[B] — yes.** Public repo. *"the same Apple TV-style home rebuilt as a webOS web app for LG TVs, installed through LG's Developer Mode, **with a Home-button watcher that runs on another device**"*. |
| [Fire OS 6 Home watcher](https://github.com/ljis120301/tv-vibehack/tree/fire-tv-support) | Fire TV Stick 4K, Fire OS 6 | | **[B] — yes**, public repo. Brings the launcher up *over* Amazon's home. |
| [Fire TV Glass](https://github.com/ivantrj/firetv-glass-launcher) | Fire OS 8 / Android 11 | | **[B] — yes.** *"an accessibility service brings Glass back whenever Amazon's home appears."* |
| [Stremio shelf](https://github.com/benfirad/tv-vibehack) | Android TV | | [B] |
| [Hisense restyle](https://github.com/YouLop009/tv-vibehack/tree/style-modifications) | Android TV 12 | Hisense | [B] |
| [CleanMyTCL-Android9](https://github.com/eddysangalli/CleanMyTCL-Android9) | Android TV 9 | TCL | [B] — also has published per-device benchmarks |
| [CleanXiaomiTV](https://github.com/majnioui/CleanXiaomiTV) | Google TV 11 | Xiaomi | [B] |
| [tv-bookshelf](https://github.com/griffincockfoster56/tv-bookshelf) | Android TV 10 | Sony BRAVIA 4K UR2 | [B] |
| [KIDŌ](https://github.com/glidiandev/kido) | Android TV 11 | Sharp AQUOS 4K | [B] |
| [Cosy Home](https://github.com/oliverjwroberts/cosy-home-tv) | Android TV 11 | Philips 55OLED707 | [B] |
| [Hisense 55U6K](https://github.com/vlaship/cleanyourtv/tree/hisense-55u6k) | Google TV 11 | Hisense | [B] |
| [Aurora screensaver](https://github.com/rakshajag13/tv-vibehack/tree/xiaomi-mitv-axso0-debloat-wallpaper) | Android TV 9 | Xiaomi | [B] |
| [Rotating wallpapers](https://github.com/Alafazam/cleanyourtv/tree/axso2-launcher) | Android TV 9 | Xiaomi | [B] |
| [Sony China launcher](https://github.com/roninriddle/tv-vibehack/tree/sony) | Android TV 14 | Sony | [B] |
| [Control Center](https://github.com/samdegan2311/tv-vibehack/tree/pr/control-center) | Android TV 11 | Xiaomi | [B] |
| [Navigation sounds](https://github.com/rocavence/tv-vibehack/tree/nav-sounds) | Google TV 14 | BenQ | [B] |
| [AirPlay receiver installer](https://github.com/nguyenduchoai/tv-vibehack/tree/feat/airplay-receiver) | Android TV 9 | Xiaomi | [B] |
| [Redmi glass launcher](https://github.com/harshsingh0930/cleanyourtv/tree/axso2-launcher) (PR #316) | Android TV | Redmi | [B] |

Additional **open PRs** (not in SHOWCASE.md yet) worth reading for design ideas — all [B]:
[Compact Home](https://github.com/ptrinh/cleanyourtv/tree/compact-ui) (PR #310, "short header, icon
pills, see-through dock, magnified tiles, idle fade"), [On-TV customization](https://github.com/PatrickNoFilter/cleanyourtv)
(PR #307, "theme picker, wallpaper picker, icon moving, settings shortcuts"), [Phone control](https://github.com/ptrinh/cleanyourtv/tree/phone-control)
(PR #308, change the layout from a phone on the home network), [Screen time](https://github.com/ptrinh/cleanyourtv/tree/screen-time)
(PR #309, a 24-hour / 7-day report pill).

**There is no Samsung/Tizen project in this list.** The one precedent for "porting to a non-Android
TV OS" is the **webOS** one by @OmkarK97, and it is instructive: it is a **web app** (not a native
app), installed through **LG's Developer Mode**, and it explicitly needed **"a Home-button watcher
that runs on another device"** — i.e. the community *also* could not take the Home button on webOS.
That is the closest available template for a Samsung Tizen attempt, and it is the honest model to
copy: **build a dashboard app, and accept that the Home button stays Samsung's.**

### 4.2 GitHub issues and PRs in the upstream repo — [A]

Checked with `gh` on 2026-10-20 against `Gathin23/cleanyourtv`:

- `gh issue list --search "samsung"` → **one** hit: issue **#332** *"Adding support of features that
  are not present"* (arnavd9, opened 2026-10-20). Reading it: it asks to add *"the samsung tv app
  support as it has given me access of 150+ channels which I usually use on my samsung phone"* and
  AirPlay. **This is about the Samsung TV Plus / phone-control app — it is not a request to support
  Samsung televisions, and it has zero comments.** It is not evidence of any Tizen support.
- `gh issue list --search "tizen"` → **zero** issues.
- `gh issue list --search "sdb"` → **zero** issues.
- A full sweep of the 100 most recent issues across all states for platform words in titles returns
  exactly one: **#79 "Fire TV"** (CLOSED). It is the single most relevant precedent and was read:

  > **#79 — "Fire TV"** — https://github.com/Gathin23/cleanyourtv/issues/79
  > **@Gathin23:** "Partly, as of today. **Debloating works on Fire OS**… **Replacing the home screen
  > does not: Fire OS protects Amazon's launcher and ignores the home preference, so the launcher
  > half of this project cannot apply there.** Two contributors built overlay workarounds (#4 and
  > #82); they are not going into the main launcher, but the PRs are there if you want to try one.
  > The README now says this under Supported TVs."

  This is the project's **own precedent for a non-Android TV platform**: *de-bloat half yes, launcher
  half no, workaround as a separate PR, README updated to say so.* A Tizen port lands in exactly the
  same place.
- No Samsung or Tizen work appears among the ~60 open PRs either.
- The three repository Discussions (#254 C71KW-200 / AT&T Osprey, #304 Accounts and Profile, #333
  Philips Titan OS) are all Android/other and none mention Samsung or Tizen.
- Repo stats at time of inspection: 8,814 stars, 989 forks; GitHub API `open_issues_count: 51`;
  repository created 2026-10-17.
- The closest relevant issues are about *Android* launcher-home handover failures, which are the
  failure modes you would also hit on Samsung and are worth reading for the **restore** discipline:
  - **#62** "TV gets stuck on Google TV boot screen after reboot with custom launcher"
  - **#49** "HOME still opens Google TV/Recovery after set-home-activity reports Success"
  - **#90** "Google TV 14 (launcherx): disabling the stock launcher crash-loops system_server"
  - **#101** "TCL 98C12L (China, Android 14): wireless debugging is on but there is no way to get a
    pairing code (Developer options hidden)"
  - **#227** "Support for Airtel Xstream Smart Box (Android 11) — ADB debugging disabled"
  - **#37** "TCL ak30a5 (China, Android TV 9, no GMS): firmware refuses any third-party launcher at
    parse time"
  - **#321** "OnePlus TV (Android 11) — Debloating OEM services breaks HDMI input handshake ('No
    Signal')"

### 4.3 Known failure modes and restore limitations (upstream, [A] from the repo's own docs)

- **Nothing is uninstalled, only `pm disable-user`-ed** — reversible from the TV's own
  Settings → Apps even without the tools. (Android TV only; Tizen has no equivalent.)
- The undo record lives in `~/.cleanyourtv/`, one file per TV and list, and a second run of the same
  list keeps the first record. **If the record is lost, the restore script falls back to enabling the
  whole list and resetting the animation scales** — it cannot restore anything it did not record.
- `tools/restore.sh` leaves the new launcher installed; removing it is a manual step in Settings →
  Apps.
- Google TV's setup wizard (`com.google.android.tungsten.setupwraith`) can take over Home after the
  stock launcher is disabled and **crash-loop `system_server`**; disabling it deletes the saved Wi-Fi
  network and takes the TV off Wi-Fi.
- Some China-market sets refuse **any** package declaring `android.intent.category.HOME` unless it
  carries the manufacturer's signature.
- Disabling OEM services can break **HDMI input handshake** (#321).
- Network ADB is **plaintext on port 5555**, and on firmware with `ro.adb.secure=0` any device on the
  LAN gets a shell. The upstream docs tell you to turn debugging off afterwards and to verify
  `nc -vz <tv ip> 5555` fails.
- macOS blocks `adb connect` under Local Network privacy — the reason `tools/tv.py` exists.

### 4.4 Performance claims — [C], all of them

Examples found on the site and in the thread: *"200% better"* (LG webOS, @hjcinelli), *"~80% faster"*
(OnePlus, @kingloves2code), *"2x speed"* (@SirCribs_a_Lot), *"boots up in 1 second"* (Freestyle),
*"40 MB RAM"* / *"60 fps on a 2.3 GB set"*, *"the entire process took just 25 minutes"*.

None of these are measurements. There is one repo-linked exception: the upstream CI enforces a
**release APK under 400 KB** (`test "$size" -lt 409600`) because the launcher targets 1 GB TVs —
that is a real, enforced constraint, and it is the project's actual engineering discipline. A
published benchmark exists in one community fork (`CleanMyTCL-Android9`, "published per-device
benchmarks") — a **[B]**-grade data point worth reading.

### 4.5 Tizen community tooling — [B], reproducible commands you can actually use

This is the most practically useful section of this file. Unlike the Freestyle example, these
carry **actual commands**.

**Removing Tizen apps over `sdb` (undocumented vendor namespace) — [B], unverified on new firmware**

| Report | URL | Substance |
|---|---|---|
| "TizenTV bloatware uninstall guide" (r/samsung) | https://www.reddit.com/r/samsung/comments/15p9gkw/tizentv_bloatware_uninstall_guide/ | `sdb devices` → `sdb shell 0 vd_applist \| findstr /i "app_id app_title"` → `sdb shell 0 vd_appuninstall APPID`. The `0` + `vd_` prefix is an **undocumented vendor command namespace**, distinct from the documented `sdb uninstall <pkg-id>`. The guide itself warns the ID is *above* the name. |
| "Delete bloatware apps on Tizen Samsung QLED Q70T using SDB" (r/Tizen, 2019) | https://www.reddit.com/r/Tizen/comments/i373bg/delete_bloatware_apps_on_tizen_samsung_qled_q70t/ | Same route; explicitly requires the package-ID for the specific app. |
| "Notes on Tizen commands that might work" (gist) | https://gist.github.com/laat/2b7107298593dca650062b7678279386 | Explains the `sdb shell 0 <cmd>` namespace and the undocumented `vd_*` commands. |

> ⚠️ **Unverified on current firmware.** These guides date from 2019–2023 and use an undocumented
> namespace. Samsung's official answer is that preinstalled apps cannot be removed (Q4). Whether
> `vd_appuninstall` still removes preinstalled apps on Tizen 8/9/10 is **not verified**. Treat this
> as an experimental avenue with a permission checkpoint, not as a known technique.

**The Tizen equivalent of `tools/tv.py 'input keyevent …; screencap -p …'` — [B]**

| Report | URL | Substance |
|---|---|---|
| "Open Tizen Remote Web Inspector from command line" | https://stackoverflow.com/questions/45275774/ | *"you can tell the TV to open a debugging port and then use `sdb forward` it to your local machine without the Tizen Studio IDE… `sdb shell 0 debug SomePackage.Identifier` then take the port returned there and forward it `sdb forward tcp:45087 tcp:45087`"* → attach Chrome DevTools to a Tizen web app. |
| "How to access and use Tizen Device Manager using CLI" | https://stackoverflow.com/questions/76136710/ | Confirms SDB is the supported CLI path to install and run apps on a real Samsung target without the IDE. |

**This is the single most useful finding for a Tizen build**: you do not need the IDE to *see* what
your app is doing. You can drive the TV over `sdb`, pull the remote inspector over `sdb forward`, and
inspect the live DOM in Chrome DevTools — the direct counterpart of the repo's screenshot-and-look
loop.

**Existing Tizen projects worth reading — [B]**

| Project | URL | Substance |
|---|---|---|
| **TizenPortal** | https://github.com/axelnanol/tizenportal | *"A browser shell for Samsung Smart TVs running Tizen OS. It provides a launcher for managing any websites and injects site-specific fixes for TV compatibility."* — a **Tizen web app acting as a kiosk**. The nearest existing analogue to what is actually buildable on Tizen, and a browser shell rather than a system-shell replacement. |
| **Apps2Samsung** | https://github.com/Apps2Samsung/Apps2Samsung | Described as *"a small cross-platform tool that side-loads any app onto Samsung devices running Tizen OS — Smart TVs, projectors and smart monitors… It handles device detection, certificates, and installation."* ⚠️ Its `main`-branch README now describes a different purpose (serving a `third-party-apps.json` manifest channel), so the project is **in flux** — treat as a pointer, not a guarantee. |
| "Deploy Apps to Samsung Smart TV: The Bash Script That Saves Hours" | https://dev.to/sundr_dev/deploy-apps-to-samsung-smart-tv-the-bash-script-that-saves-hours-175b | Scripted `sdb` connect → resolve device → package/sign as `.wgt` with your certificate → install. A concrete Tizen analogue of the repo's `tools/` scripts. |

**Sources to avoid.** A cluster of content-farm pages claim you can install Google Play / APKs on
Samsung TVs (e.g. `tvgui.einstapp.com/article/install-apk-samsung-tv-2026`,
`appuals.com/how-to-download-third-party-apps-to-samsung-smart-tv/`,
`smartertv.live/blog/en/can-you-install-google-play-store-samsung-smart-tv`). These are **directly
contradicted by Samsung's own staff answer**: *"Samsung tvs are not capable of running .APK files"*
(https://us.community.samsung.com/t5/LED-and-OLED-TVs/How-to-use-sideloading-on-my-TV/td-p/3497986).
Do not rely on them.

**IP Control is a different thing.** Samsung's *IP Control* protocol
(<https://image-us.samsung.com/SamsungUS/samsungbusiness/tv-ci-resources/Samsung-IP-Control.pdf>) is a
remote-control-over-LAN protocol for CI/commercial integrations, enabled at *Settings → Network →
Expert Settings → IP Remote*. It sends key events, power, volume and source. **It is not a shell,
not an installer, and not an ADB substitute.**

---

## 5. Practical routes for Edris's Samsung, ranked

### Route 0 — Identify the TV first. Everything else depends on this.
Settings → Support → About → **Model name** and **software version**. Then look the model up in
Samsung's model-group table (§1.1) to get its Tizen version and the matching **TV Extension** version.

- If it is **Tizen** (overwhelmingly likely for a Samsung TV): the rest of this section applies.
- If it is somehow **Google TV**: this repo works as-is. Install the JDK 17 + Android SDK 34, build
  the launcher, and follow `README.md` + `PROMPT.md`. Do the debloat half *only* after the launcher
  is installed and running — that ordering is not optional (see `launcher/build-and-install.sh`).

### Route 1 — Build a Tizen TV dashboard app ("Apple TV-style home" on Samsung)
The realistic deliverable. A new Tizen web app, in **its own repo** (not this one), built with
Tizen Studio, installed over `sdb` in Developer Mode, launched from the TV's Apps row.

- **What you can reproduce from the community:** the *design* language of `cleanyourtv` (pitch-black
  background, top shelf with the focused app's name, a dock row, a grid, glass pills for
  Inputs / Network / Settings, a clock screensaver) and the **webOS port by @OmkarK97
  (https://github.com/OmkarK97/webos-vibehack)** as the closest architectural precedent.
  **TizenPortal** (https://github.com/axelnanol/tizenportal) is the nearest existing Tizen analogue —
  a Tizen web app acting as a kiosk — and is worth reading for how people structure a Tizen shell.
- **What you cannot:** own the Home button, boot into it, or remove Samsung's preinstalled apps.
- **Extra work this repo's launcher already solves for you and you will have to redo for Tizen:**
  remote-key navigation model, focus memory, app listing via a Tizen API rather than Android's
  package manager, inputs switching via the Tizen TV input API, wallpaper handling, and the
  clock screensaver.
- **The name→ID problem.** Android package names (`com.netflix.ninja`) are readable; Tizen package
  IDs are 10-character hashes (`ko983dw33q`). The repo's whole data model — text files of dotted
  package names — does not port. Any list of apps you want in your dashboard has to be a **Tizen
  package-ID list**, resolved with `sdb shell 0 vd_applist` (undocumented) or by reading the IDs out
  of the installed app list on the TV.
- **The verify loop has a Tizen equivalent, and it is good.** You do not need the Tizen Studio IDE:
  `sdb shell 0 debug <pkg-id>` returns a debug port, `sdb forward tcp:<port> tcp:<port>` brings it to
  your Mac, and Chrome DevTools attaches to the live Tizen web app. That is the direct counterpart of
  the repo's `input keyevent … ; screencap -p …` + "look at the screenshot" workflow, and it is
  arguably better for a web app.
- **The two sanctioned ways to appear on Samsung's own home surface** are **prelaunching**
  (`http://samsung.com/tv/metadata/prelaunch.support` — start in the background at power-on) and a
  **Smart Hub Preview** section (tiles inside Samsung's hub that deep-link into your app). Neither
  is the Home button, and Samsung explicitly forbids using Smart Hub Preview for advertising.
- **The Home-button problem** has exactly two known community answers, both of them workarounds:
  an **accessibility service** (Fire OS) or a **watcher on another device** (webOS). Neither is
  available to a Tizen app in the same way, so on Samsung the realistic UX is *"open the dashboard
  from the Apps row"*.

### Route 2 — An external Android/Google TV box on HDMI
Unlocks the entire `cleanyourtv` project verbatim, with full Home-button control and real debloating.
Costs: the Samsung tuner and HDMI-CEC behaviour, some Samsung remote buttons, and one more box.
Several showcase participants did exactly this.

### Route 3 — De-bloat the Samsung
**Not possible on Tizen.** [A] — "Preinstalled applications cannot be removed" (Samsung Q4). On a
Google TV Samsung, this is exactly what `tools/disable.sh` does.

### Route 4 — Modify the Samsung TV firmware / flash custom ROM
Not attempted, not researched in depth, **and not recommended**: it is out of scope for this task,
requires unlockable/bootloader access that Samsung consumer TVs generally do not offer, and carries
a real brick risk. Nothing in the community examples did this — every one of them changed the home
screen, not the operating system.

---

## 6. Sources and access log

| # | Source | URL | Accessed | Grade |
|---|---|---|---|---|
| 1 | Upstream repo, commit `09fe4e40` | https://github.com/Gathin23/cleanyourtv | 2026-10-20 | A |
| 2 | `PROMPT.md` line 5 | local, `PROMPT.md` | 2026-10-20 | A |
| 3 | `README.md` lines 115–121 | local, `README.md` | 2026-10-20 | A |
| 4 | `SHOWCASE.md` | local, `SHOWCASE.md` | 2026-10-20 | A/B |
| 5 | Project website | https://cleanyour.tv/ | 2026-10-20 | A/C |
| 6 | Originating tweet | https://x.com/gathint/status/2111379569030939102 | 2026-10-20 | A (text) / C (claims) |
| 7 | Samsung Freestyle tweet | https://x.com/pranavrajs/status/2112018629697093737 | 2026-10-20 | C |
| 8 | X search (login-gated) | https://x.com/search?q=tv&src=typed_query | 2026-10-20 | A (inaccessible) |
| 9 | Samsung — TV Model Groups | https://developer.samsung.com/smarttv/develop/specifications/tv-model-groups.html | 2026-10-20 | **A** |
| 10 | Samsung — Application Installation Q&A | https://developer.samsung.com/smarttv/develop/faq/application-installation.html | 2026-10-20 | **A** |
| 11 | Samsung — Command Line Interface (`sdb`) | https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/command-line-interface.html | 2026-10-20 | **A** |
| 12 | Samsung — TV Device (Developer Mode / real TV) | https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/tv-device.html | 2026-10-20 | A (indexed) |
| 13 | Samsung — Creating Certificates | https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html | 2026-10-20 | A (indexed) |
| 14 | Samsung — Remote Control API | https://developer.samsung.com/smarttv/develop/guides/user-interaction/remote-control.html | 2026-10-20 | A (indexed) |
| 15 | Samsung — ProductInfo API (`getModel()`) | https://developer.samsung.com/smarttv/develop/api-references/samsung-product-api-references/productinfo-api.html | 2026-10-20 | A (indexed) |
| 16 | Samsung — Third-party Features Q&A | https://developer.samsung.com/smarttv/develop/faq/third-party-features.html | 2026-10-20 | A |
| 17 | Samsung — Smart TV / One UI Tizen | https://www.samsung.com/latin_en/tvs/smart-tv/smart-hub-and-apps/ | 2026-10-20 | A |
| 18 | Freestyle 2022 product specs (Tizen) | https://images.samsung.com/is/content/samsung/assets/au/tvs/product-specs/the-freestyle-2022-product-specs.pdf | 2026-10-20 | A |
| 19 | RTINGS — Freestyle 2nd Gen (Tizen OS) | https://www.rtings.com/projector/reviews/samsung/the-freestyle-2nd-gen | 2026-10-20 | A |
| 20 | webOS community port | https://github.com/OmkarK97/webos-vibehack | via SHOWCASE.md | B |
| 21 | Fire OS Home watcher | https://github.com/ljis120301/tv-vibehack/tree/fire-tv-support | via SHOWCASE.md | B |
| 22 | Fire TV Glass (accessibility service) | https://github.com/ivantrj/firetv-glass-launcher | via SHOWCASE.md | B |
| 23 | GitHub issues / PRs on the upstream repo | `gh issue list --repo Gathin23/cleanyourtv` (#332, #79, #62, #49, #90, #101, #227, #37, #321) | 2026-10-20 | A |
| 24 | **The Freestyle image published by cleanyour.tv — downloaded and inspected directly** | https://cdn.jsdelivr.net/gh/Gathin23/cleanyourtv-website@main/public/results/pranavrajs.jpg | 2026-10-20 | **A** (shows the **stock** Tizen home) |
| 25 | Samsung — Configuring TV Applications (the `<tizen:metadata>` key set) | https://developer.samsung.com/smarttv/develop/guides/fundamentals/configuring-tv-applications.html | 2026-10-20 | **A** |
| 26 | Samsung — Smart Hub Preview | https://developer.samsung.com/smarttv/develop/guides/smart-hub-preview/smart-hub-preview.html | 2026-10-20 | **A** |
| 27 | Samsung — Tizen **SDB** specification (first-party source) | https://github.com/Samsung/tizen-docs/blob/master/docs/sdk-tools/baseline-sdk/common-tools/smart-development-bridge.md | 2026-10-20 | **A** |
| 28 | Samsung — Tizen **package manager** API | https://github.com/Samsung/tizen-docs/blob/master/docs/application/native/guides/app-management/package-manager.md | 2026-10-20 | **A** |
| 29 | Samsung community (staff) — sideloading on Tizen: *"Samsung tvs are not capable of running .APK files"* | https://us.community.samsung.com/t5/LED-and-OLED-TVs/How-to-use-sideloading-on-my-TV/td-p/3497986 | 2026-10-20 | A |
| 30 | Samsung — General Specifications (OS Upgrade note, 2023+ lineups) | https://developer.samsung.com/smarttv/develop/specifications/general-specifications.html | 2026-10-20 | A |
| 31 | Samsung — Legacy Platform (pre-Tizen, ≤2014) | https://developer.samsung.com/smarttv/legacy/overview.html | 2026-10-20 | A |
| 32 | Samsung Newsroom — Freestyle 2nd Gen *"Built with Tizen OS"* | https://news.samsung.com/us/samsung-announces-pre-order-freestyle-gen-2-gaming-hub/ | 2026-10-20 | A |
| 33 | Samsung IP Control protocol (not a shell) | https://image-us.samsung.com/SamsungUS/samsungbusiness/tv-ci-resources/Samsung-IP-Control.pdf | 2026-10-20 | A |
| 34 | TizenPortal — browser shell for Samsung Tizen TVs | https://github.com/axelnanol/tizenportal | 2026-10-20 | B |
| 35 | Apps2Samsung — Tizen sideloading tool (in flux) | https://github.com/Apps2Samsung/Apps2Samsung | 2026-10-20 | B |
| 36 | Remote web inspector over `sdb forward` (the Tizen `screencap` loop) | https://stackoverflow.com/questions/45275774/ | 2026-10-20 | B |
| 37 | "TizenTV bloatware uninstall guide" — `sdb shell 0 vd_appuninstall` | https://www.reddit.com/r/samsung/comments/15p9gkw/tizentv_bloatware_uninstall_guide/ | 2026-10-20 | B (undocumented, dated) |
| 38 | Tizen `vd_*` command namespace notes | https://gist.github.com/laat/2b7107298593dca650062b7678279386 | 2026-10-20 | B (undocumented) |
| 39 | clrn.org — "generally not supported… no option to replace it with a third-party launcher" | https://www.clrn.org/how-to-change-default-app-on-samsung-tv/ | 2026-10-20 | B |
| 40 | Google **Cast** on Samsung 2026 TVs — *not* Google TV | https://www.xda-developers.com/samsung-tvs-just-gained-native-google-cast-and-my-chromecast-is-officially-pointless/ | 2026-10-20 | B |

---

## 7. Things I could not verify, and will not claim

- Whether the Freestyle's "custom launcher" was a Tizen app, an HTML page, or something else. No
  code, no steps, the direct questions in the thread are unanswered, and **the only published image
  shows the stock Tizen home screen**.
- Whether a Tizen app can ever be granted the Home button on any Samsung model, ever. I found no
  official statement saying "you cannot"; the conclusion rests on the absence of a HOME-intent
  mechanism in the manifest model, the "preinstalled applications cannot be removed" rule, the
  absence of any documented API, and two independent community sources. That is strong, but it is
  inference from the platform's design, not a prohibition notice.
- Whether `sdb root on` actually succeeds on a **retail consumer** Samsung TV. It is documented in
  the official SDB spec, but retail behaviour is firmware-dependent and was not tested.
- Whether `sdb shell 0 vd_appuninstall` still removes **preinstalled** apps on current Tizen 8/9/10
  firmware. The community guides are 2019–2023 and use an undocumented namespace; official Q4 says
  preinstalled apps cannot be removed.
- Whether Edris's specific Samsung runs Tizen or Google TV. **Unknown until the model is read off
  the TV.** (Note: no evidence was found that any Samsung consumer TV ships Google TV at all —
  Samsung's own platform matrix has no such entry — so Tizen is the working assumption.)
- Any measured performance improvement. Every number circulating is a poster's impression.
- Whether the upstream repo would accept a Samsung/Tizen contribution. Its README and PROMPT both
  say the project does not support Tizen, and `CONTRIBUTING.md` says "Keep it brand-neutral; put
  brand-specific knowledge in `examples/`" — which points to *lists*, not to a new platform port.
  A Tizen port would be a **separate repository** that `SHOWCASE.md` links to, exactly as the webOS
  port is. Issue **#79** ("Fire TV") shows the maintainer's precedent: debloat half yes, launcher
  half no, workarounds as separate PRs, README updated to say so.
- The current behaviour of `Apps2Samsung` — its `main` branch now describes a different purpose
  from what search results describe.
- The full contents of `docs/press/`, `docs/specs/`, `themes/` and the launcher's internals were
  not read exhaustively — only their structure and the parts bearing on platform support.
