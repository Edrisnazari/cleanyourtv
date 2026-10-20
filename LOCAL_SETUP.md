# Local setup — cleanyourtv on macOS

Prepared for Edris on **2026-10-20** by an OpenCode agent, as groundwork for a second agent
(Antigravity). This file records what was actually done on this machine. It is excluded from git
via `.git/info/exclude` and is not committed.

---

## 1. Host machine (measured, not assumed)

| Item | Value |
|---|---|
| OS | macOS 27.0.1 (build 26A434) |
| CPU architecture | `arm64` (Apple Silicon) |
| Shell | zsh |
| Git | 2.54.0 |
| Free disk | 342 GiB available on `/System/Volumes/Data` (926 GiB total, 63% used) |
| Python | 3.12.13 — `/opt/homebrew/opt/python@3.12/libexec/bin/python3` (Homebrew) |
| Homebrew | 7.0.9 (`/opt/homebrew/bin/brew`) |
| Node | present at `/opt/homebrew/bin/node` (**not used by this project**) |
| JDK | **none installed** — `java -version` → "Unable to locate a Java Runtime" |
| Android SDK | **not installed** — no `ANDROID_HOME`/`ANDROID_SDK_ROOT`, no `~/Library/Android/sdk` |
| `adb` binary | **not installed** (and not needed — see §4) |

---

## 2. Clone

The target directory did not exist before this run, so a fresh clone was performed. No existing
work was touched, overwritten, reset, cleaned or pulled over.

```bash
git clone https://github.com/Gathin23/cleanyourtv.git /Users/edris/Documents/cleanyourtv
```

| | |
|---|---|
| Repository URL | https://github.com/Gathin23/cleanyourtv.git |
| Remote name | `origin` (fetch + push point at the URL above) |
| Branch | `main` (tracking `origin/main`) |
| **Commit SHA** | `09fe4e40a2a676ce2596f594df1083da4aede58f` |
| Commit date | Tue Oct 20 17:08:59 2026 +0530 |
| Commit subject | `README: NVIDIA Shield now has two lists in the brand line` |
| Date inspected | 2026-10-20 |
| Working tree | **clean** (`git status --short` empty) at inspection time |

`/Users/edris/Documents` already existed.

---

## 3. What this project actually is

**It is an Android TV / Google TV project. It is not a Tizen project.**

Three parts:

| Path | What it is | Toolchain |
|---|---|---|
| `launcher/` | A native Android TV launcher app, `com.gathin.tvhome`, plain **Java** + AndroidX RecyclerView + DynamicAnimation. **28 Java files, 7,230 lines** (plus 10 JUnit test files, 1,327 lines). Debug-signed, ~370 KB release APK. | Gradle 8.9 (wrapper), Android Gradle Plugin 8.5.2, **JDK 17**, **compileSdk/targetSdk 34**, minSdk 26 |
| `tools/` | Pure-Python **ADB-over-TCP** client and helpers: `tv.py` (shell/batch/push/pull), `b64push.py` (chunked base64 file upload), `disable.sh` / `restore.sh` (apply/undo a debloat list), `recovery.py` (writes the undo record), `theme.sh` (push a theme) | **Python 3 only**, no third-party framework |
| `examples/` | 93 per-model debloat lists (one folder per TV model), each a plain-text file of package names | plain text |
| `themes/` | 4 themes (`default`, `aurora`, `dussehra`, `six-columns`), each a `config.json` + optional wallpaper | JSON |
| `tests/` | 32 pure-Python unit tests over lists, tools and the install script's handover logic | `unittest` (stdlib) |

There is **no Node.js, no npm, no package.json, no Docker, no web server** anywhere in the repo.
It is not a Node application.

---

## 4. What was installed

Exactly one thing: a **project-local Python virtualenv** for the `tools/` ADB client.

```bash
cd /Users/edris/Documents/cleanyourtv
python3 -m venv tools/venv
tools/venv/bin/pip install --upgrade pip
tools/venv/bin/pip install -r tools/requirements.txt
```

`tools/requirements.txt` declares three packages (all from the upstream repo, unpinned):

| Package | Version installed | Purpose |
|---|---|---|
| `adb-shell` | 0.4.4 | Pure-Python ADB client. Used because the stock `adb` binary is blocked by macOS Local Network privacy on port 5555 ("No route to host") — see `README.md` and `CONTRIBUTING.md` §3. |
| `rsa` | 4.9.1 | RSA signing for the ADB auth handshake. |
| `cryptography` | 50.0.2 | Crypto primitives pulled in by the above. |

Transitive: `pyasn1` 0.6.4, `cffi` 2.1.1, `pycparser` 3.11.

Notes:
- The venv lives at `tools/venv/` **inside the repo**, which is already covered by `.gitignore`
  (line 1) and additionally by `.git/info/exclude`. It is not in your global site-packages.
- No system Python package was touched. No `sudo` was used. No global shell configuration was
  changed. No package was installed system-wide via Homebrew.
- `tools/requirements.txt` has **no version pins**. If you need a reproducible environment, generate
  a lockfile (`tools/venv/bin/pip freeze > tools/requirements.lock.txt`) — but do **not** commit it
  unless upstream asks, as `.gitignore` does not cover it.

---

## 5. Checks actually run, and their real results

### 5.1 Python test suite — PASS

Mirrors the `lists-and-tools` job in `.github/workflows/ci.yml`:

```bash
cd /Users/edris/Documents/cleanyourtv
python3 -m unittest discover -s tests -v
```

**Actual result:**

```
Ran 32 tests in 6.899s
OK (skipped=1)
```

The one skip is `test_examples.test_readme_counts`, which is skipped unless
`CLEANYOURTV_STRICT=1`. Running the strict variant used by CI on pushes to `main`:

```bash
CLEANYOURTV_STRICT=1 python3 -m unittest discover -s tests
```

**Actual result:** `Ran 32 tests in 4.875s` → `OK` (no skips).

These tests are safe by construction: they use `tempfile` directories and stub `tv.py`/gradlew
clients. They never open a socket to a TV or to the network.

### 5.2 Tool import check — PASS (and correctly refuses to run)

```
$ tools/venv/bin/python -I tools/tv.py --probe
Set TV_HOST to your TV's IP address, e.g.  TV_HOST=192.168.1.50 tools/tv.py --probe
(find it in `arp -a`)
Exited with code 1
```

`tools/tv.py` exits at import time when `TV_HOST` is unset. This confirms the ADB client is
installed and working, and that it will not attempt to reach anything without being pointed at a
host.

### 5.3 Git hygiene — PASS

```
$ git status --short
(empty)
$ git check-ignore -v LOCAL_SETUP.md RESEARCH_NOTES.md ANTIGRAVITY_HANDOFF.md tools/venv/bin/python
.git/info/exclude:10:LOCAL_SETUP.md          LOCAL_SETUP.md
.git/info/exclude:11:RESEARCH_NOTES.md       RESEARCH_NOTES.md
.git/info/exclude:12:ANTIGRAVITY_HANDOFF.md  ANTIGRAVITY_HANDOFF.md
.gitignore:1:tools/venv/                     tools/venv/bin/python
```

---

## 6. What was deliberately NOT done

| Not done | Why |
|---|---|
| **JDK 17 / Android SDK 34 / build-tools 34.0.0** | Deferred. Requires SDK licence acceptance and a large download (multiple GB). More importantly, it is not clearly needed yet: the target TV is a **Samsung**, and upstream states this project does not work on Samsung Tizen (see `RESEARCH_NOTES.md`). Installing the Android SDK now would be speculative work. |
| **`./gradlew assembleRelease`** | The only build route in this repo is `launcher/build-and-install.sh`, which is a **combined build-and-install** script that requires `TV_HOST` and connects to a real TV. Running it "just to compile" would attempt to reach a device. Per your instructions this was not run. A genuine build-only route is `cd launcher && ./gradlew testReleaseUnitTest lintRelease assembleRelease` (what CI uses) — but that needs the JDK + SDK above. |
| **`launcher/app/src/test` (10 JUnit tests)** | These are plain JVM tests run by Gradle, so they need the JDK + Android SDK. Deferred with them. |
| **Any ADB/SDB connection to a TV** | No TV was contacted. No LAN scanning was done. No debugging was enabled on any device. No TV settings were changed. `TV_HOST` was never set. |
| **`tools/disable.sh`, `tools/restore.sh`, `tools/theme.sh`** | These mutate a real TV. Inspected only. |
| **Homebrew installs, `sudo`, global shell config changes** | Not needed; nothing required them. |
| **Commit, push, fork, publish** | Explicitly out of scope. Nothing was pushed anywhere. |

---

## 7. Deferred dependencies — requirements if they become necessary

### For the Android launcher build (only if you end up targeting an Android/Google TV)

- **JDK 17** — `brew install openjdk@17` (Homebrew 7.0.9 is present) or any Temurin 17.
- **Android SDK** with `platforms;android-34` and `build-tools;34.0.0`:
  `brew install android-commandlinetools` then
  `sdkmanager "platforms;android-34" "build-tools;34.0.0"`.
  The script also accepts `~/Library/Android/sdk` or `~/Android/Sdk` as `ANDROID_HOME`, and writes
  `launcher/local.properties` with `sdk.dir=...` (gitignored).
- **Gradle 8.9** is fetched automatically by the wrapper (`launcher/gradle/wrapper/gradle-wrapper.properties`)
  into `~/.gradle`. No separate install.
- **Google Maven + Maven Central** network access for `androidx.recyclerview:recyclerview:1.3.2`,
  `androidx.dynamicanimation:dynamicanimation:1.0.0`, `junit:junit:4.13.2`.

### For a Samsung Tizen target (different toolchain entirely)

- **Tizen Studio** (the official Tizen IDE, bundles the Tizen SDK) and the **Tizen TV** platform add-on.
- A Tizen **certificate profile** (`.p12` + `.tpk` signing) issued through Samsung's partner portal.
- **Tizen Web / TV API** documentation for app lifecycle, remote key handling, and any storage APIs.
- The usual `tizen build-web` / `tizen install` / `tizen run` CLI.
- **No such tooling is installed here**, and none of it can install or replace Samsung's system
  Home screen — see `RESEARCH_NOTES.md` for the platform evidence.

---

## 8. Rollback / cleanup

Everything done here is local and trivially reversible:

```bash
# Remove the virtualenv (the only thing installed)
rm -rf /Users/edris/Documents/cleanyourtv/tools/venv

# Remove the local handover documents
rm -f /Users/edris/Documents/cleanyourtv/{LOCAL_SETUP,RESEARCH_NOTES,ANTIGRAVITY_HANDOFF}.md

# Remove the local git exclude additions (edit .git/info/exclude, drop the block
# marked "local setup artefacts (added by OpenCode preparation, 2026-10-20)")

# Remove the clone entirely
rm -rf /Users/edris/Documents/cleanyourtv
```

Nothing outside `/Users/edris/Documents/cleanyourtv` was modified. No system state, no Homebrew
packages, no global Python, no shell config, no network credentials, no TV.

---

## 9. Commands you can run right now

```bash
cd /Users/edris/Documents/cleanyourtv

# Run the full local test suite (safe, no network, no device)
python3 -m unittest discover -s tests -v

# Use the ADB client against an Android TV (NOT a Samsung Tizen set)
# TV_HOST=<ip> tools/venv/bin/python -I tools/tv.py --probe
```

---

## 10. Related documents

- `RESEARCH_NOTES.md` — Samsung / Tizen feasibility research, community examples, source URLs.
- `ANTIGRAVITY_HANDOFF.md` — the brief for the next agent: what to ask Edris, what to build, and
  the safety checkpoints.
