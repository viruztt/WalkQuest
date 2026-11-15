#!/usr/bin/env python3
"""WalkQuest server: serves the app and keeps your progress so every device shares it.

    python3 server.py            then open http://localhost:8095

Optional: the app works without it (progress then stays in each browser), but with it
your walks, XP, maps and collection sync between your computer and your phone.

Progress API (one person, many devices):
    GET  /api/state  -> {"rev": n, "doc": {...} | null}
    PUT  /api/state  <- {"baseRev": n, "doc": {...}, "force": false}
                     -> 200 {"rev": n+1}, or 409 {"rev", "doc"} when another device saved
                        first (the app merges and tries again). "force" replaces the stored
                        progress (used by Erase all progress and Import backup).

Settings (environment):
    WALKQUEST_PORT  port, default 8095
    WALKQUEST_BIND  address to listen on, default 127.0.0.1 (this computer only). There is no
                    login, so only open it up on a network you trust, or put it behind
                    something that adds https and access control.
    WALKQUEST_ROOT  folder with index.html, default: ./app next to this file if there is one,
                    otherwise the folder this file is in
    WALKQUEST_DATA  where progress is stored, default ./data next to this file. A dated copy
                    is kept each day (last 30 days).

Web Bluetooth needs https or localhost, so to use the treadmill from another device serve
this over https (for example with a reverse proxy).
"""
import datetime
import functools
import json
import os
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("WALKQUEST_PORT", "8095"))
BIND = os.environ.get("WALKQUEST_BIND", "127.0.0.1")
ROOT = os.environ.get("WALKQUEST_ROOT") or (
    os.path.join(HERE, "app") if os.path.isfile(os.path.join(HERE, "app", "index.html")) else HERE)
DATA = os.environ.get("WALKQUEST_DATA") or os.path.join(HERE, "data")
STATE = os.path.join(DATA, "state.json")
MAX_BODY = 8 * 1024 * 1024
KEEP_DAYS = 30
LOCK = threading.Lock()
# Never serve these as static files (the server itself, stored progress, git files).
HIDDEN = ("/server.py", "/data", "/.git", "/deploy")


def load_state():
    try:
        with open(STATE, encoding="utf-8") as f:
            st = json.load(f)
        return {"rev": int(st.get("rev", 0)), "doc": st.get("doc")}
    except FileNotFoundError:
        return {"rev": 0, "doc": None}


def save_state(st):
    os.makedirs(DATA, exist_ok=True)
    tmp = STATE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(st, f, ensure_ascii=False, separators=(",", ":"))
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, STATE)  # atomic: a crash never leaves half a file
    # One dated copy per day, so a bad sync can always be undone by hand.
    day = os.path.join(DATA, "state-%s.json" % datetime.date.today().isoformat())
    if not os.path.exists(day):
        with open(day, "w", encoding="utf-8") as f:
            json.dump(st, f, ensure_ascii=False, separators=(",", ":"))
        olds = sorted(n for n in os.listdir(DATA) if n.startswith("state-") and n.endswith(".json"))
        for n in olds[:-KEEP_DAYS]:
            try:
                os.remove(os.path.join(DATA, n))
            except OSError:
                pass


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      ".webmanifest": "application/manifest+json", ".js": "text/javascript"}

    def end_headers(self):
        # no-cache: a redeploy shows up on the next reload instead of an old cached app.js
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # keep the log for errors only

    def send_json(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def path_only(self):
        return self.path.split("?", 1)[0]

    def do_GET(self):
        p = self.path_only()
        if p == "/api/state":
            with LOCK:
                return self.send_json(200, load_state())
        if p.startswith("/api/"):
            return self.send_json(404, {"error": "not found"})
        if any(p == h or p.startswith(h + "/") for h in HIDDEN):
            return self.send_error(404)
        return super().do_GET()

    def do_HEAD(self):
        if any(self.path_only().startswith(h) for h in HIDDEN):
            return self.send_error(404)
        return super().do_HEAD()

    def do_PUT(self):
        if self.path_only() != "/api/state":
            return self.send_json(404, {"error": "not found"})
        try:
            n = int(self.headers.get("Content-Length", "0"))
            if n <= 0 or n > MAX_BODY:
                return self.send_json(413, {"error": "too large"})
            body = json.loads(self.rfile.read(n).decode("utf-8"))
            doc = body.get("doc")
            if not isinstance(doc, dict) or not isinstance(doc.get("history"), list):
                return self.send_json(400, {"error": "not a WalkQuest progress document"})
            base = int(body.get("baseRev", -1))
        except (ValueError, TypeError, AttributeError):
            return self.send_json(400, {"error": "bad request"})
        with LOCK:
            cur = load_state()
            if not body.get("force") and base != cur["rev"]:
                return self.send_json(409, cur)  # someone else saved first: merge and retry
            st = {"rev": cur["rev"] + 1, "doc": doc,
                  "savedAt": datetime.datetime.now().isoformat(timespec="seconds")}
            save_state(st)
        return self.send_json(200, {"rev": st["rev"]})


if __name__ == "__main__":
    handler = functools.partial(Handler, directory=ROOT)
    server = ThreadingHTTPServer((BIND, PORT), handler)
    print("WalkQuest serving %s on http://%s:%d (progress in %s)" % (ROOT, BIND, PORT, DATA), flush=True)
    server.serve_forever()
