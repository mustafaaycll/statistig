#!/usr/bin/env bash
#
# Mirrors https://gjs-docs.gnome.org into this directory as Markdown.
#
# Usage:
#   ./sync.sh                 Sync the libraries listed in libraries.txt (only changed ones are
#                             re-downloaded) and delete every other library from docs/
#   ./sync.sh 'st*' 'gio*'    Sync only libraries whose slug matches a glob pattern (no deletion)
#   ./sync.sh --force         Re-download even if the upstream version is unchanged
#   ./sync.sh --list          List the available libraries and exit
#   ./sync.sh --jobs 4        Number of parallel downloads (default: 8)
#
# Layout produced:
#   README.md                 Overview and table of every library
#   libraries.txt             Allowlist of glob patterns deciding what is mirrored (edit this)
#   libraries.json            Raw upstream library index (docs.json)
#   .manifest.json            Upstream mtime of each synced library (drives incremental sync)
#   docs/<dir>/README.md      Library metadata and a full symbol index
#   docs/<dir>/<page>.md      One Markdown file per documentation page
#
# <dir> is the slug without its version suffix (e.g. st16~16 -> st16, gio20~2.0 -> gio20),
# which matches the upstream cross-link scheme, so relative links between libraries work.
#
# Requires: bash, python3 (standard library only).

set -euo pipefail

if ! command -v python3 >/dev/null 2>&1; then
    echo "error: python3 is required" >&2
    exit 1
fi

GUIDE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export GUIDE_DIR

exec python3 - "$@" <<'PY'
import argparse
import fnmatch
import html
import json
import os
import posixpath
import re
import shutil
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser

BASE_URL = "https://gjs-docs.gnome.org"
GUIDE_DIR = os.environ["GUIDE_DIR"]
DOCS_DIR = os.path.join(GUIDE_DIR, "docs")
MANIFEST_PATH = os.path.join(GUIDE_DIR, ".manifest.json")
LIBRARIES_PATH = os.path.join(GUIDE_DIR, "libraries.json")
ALLOWLIST_PATH = os.path.join(GUIDE_DIR, "libraries.txt")


# ---------------------------------------------------------------- networking

def fetch_json(url, retries=4):
    last_error = None
    for attempt in range(retries):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "gjs-docs-sync"})
            with urllib.request.urlopen(request, timeout=120) as response:
                return json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, ConnectionError, json.JSONDecodeError) as error:
            last_error = error
            time.sleep(2 ** attempt)
    raise RuntimeError(f"failed to fetch {url}: {last_error}")


# ---------------------------------------------------------- HTML -> Markdown

BLOCK_TAGS = {"p", "div", "section", "article", "header", "footer", "blockquote",
              "dl", "details", "summary", "figure", "figcaption", "nav", "aside", "main"}
HEADINGS = {"h1": "#", "h2": "##", "h3": "###", "h4": "####", "h5": "#####", "h6": "######"}
SKIP_TAGS = {"script", "style", "svg", "button", "iframe", "template"}
LIST_ITEM = re.compile(r"^( *)(-|\d+\.) (.*)$")
VOID_TAGS = {"br", "hr", "img", "input", "meta", "link", "wbr", "col", "area", "source"}


def rewrite_href(href):
    if not href or href.startswith(("#", "mailto:", "javascript:")) or re.match(r"^[a-z][a-z0-9+.-]*:", href):
        return href
    if href.startswith("/"):
        return BASE_URL + href
    path, sep, fragment = href.partition("#")
    if not path:
        return href
    if path.endswith("/"):
        path += "index"
    # "../<library>" points at another library's landing page.
    if re.fullmatch(r"\.\./[^/]+", path):
        path += "/index"
    if not path.endswith(".md"):
        path += ".md"
    return path + (sep + fragment if sep else "")


class MarkdownConverter(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.buffers = [[]]      # stack of output buffers (table cells and links push their own)
        self.skip_depth = 0
        self.pre_depth = 0
        self.lists = []          # stack of ["ul"|"ol", counter]
        self.tables = []         # stack of {"rows": [...], "row": [...] | None, "header": bool}
        self.links = []          # stack of hrefs (None when the <a> is only an anchor)

    # buffer helpers
    @property
    def buf(self):
        return self.buffers[-1]

    def emit(self, text):
        self.buf.append(text)

    def block_break(self):
        self.emit("\n\n")

    def push_buffer(self):
        self.buffers.append([])

    def pop_buffer(self):
        return "".join(self.buffers.pop())

    # parser callbacks
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if self.skip_depth or tag in SKIP_TAGS:
            if tag not in VOID_TAGS:
                self.skip_depth += 1
            return

        anchor = attrs.get("id")

        if tag in HEADINGS:
            self.block_break()
            self.emit(HEADINGS[tag] + " ")
        elif tag in BLOCK_TAGS:
            self.block_break()
        elif tag == "pre":
            self.block_break()
            self.emit("```\n")
            self.pre_depth += 1
        elif tag == "code" and not self.pre_depth:
            self.emit("`")
        elif tag in ("strong", "b"):
            self.emit("**")
        elif tag in ("em", "i"):
            self.emit("_")
        elif tag == "br":
            self.emit("\n")
        elif tag == "hr":
            self.emit("\n\n---\n\n")
        elif tag == "img":
            alt = attrs.get("alt")
            if alt:
                self.emit(alt)
        elif tag in ("ul", "ol"):
            if not self.lists:
                self.block_break()
            self.lists.append([tag, 0])
        elif tag == "li":
            depth = max(len(self.lists) - 1, 0)
            if self.lists and self.lists[-1][0] == "ol":
                self.lists[-1][1] += 1
                marker = f"{self.lists[-1][1]}. "
            else:
                marker = "- "
            self.emit("\n" + "  " * depth + marker)
        elif tag == "dt":
            self.emit("\n\n**")
        elif tag == "dd":
            self.emit("\n\n")
        elif tag == "table":
            self.block_break()
            self.tables.append({"rows": [], "row": None, "header": False})
        elif tag == "tr" and self.tables:
            self.tables[-1]["row"] = []
        elif tag in ("td", "th") and self.tables:
            if tag == "th":
                self.tables[-1]["header"] = True
            self.push_buffer()
        elif tag == "a":
            href = attrs.get("href")
            if href is not None:
                self.links.append(rewrite_href(href))
                self.push_buffer()
            else:
                self.links.append(None)

        if anchor:
            self.emit(f'<a id="{html.escape(anchor, quote=True)}"></a>')

    def handle_endtag(self, tag):
        if self.skip_depth:
            if tag not in VOID_TAGS:
                self.skip_depth -= 1
            return

        if tag in HEADINGS or tag in BLOCK_TAGS:
            self.block_break()
        elif tag == "pre" and self.pre_depth:
            self.pre_depth -= 1
            self.emit("\n```")
            self.block_break()
        elif tag == "code" and not self.pre_depth:
            self.emit("`")
        elif tag in ("strong", "b"):
            self.emit("**")
        elif tag in ("em", "i"):
            self.emit("_")
        elif tag in ("ul", "ol") and self.lists:
            self.lists.pop()
            if not self.lists:
                self.block_break()
        elif tag == "dt":
            self.emit("**")
        elif tag in ("td", "th") and self.tables and len(self.buffers) > 1:
            cell = self.pop_buffer()
            cell = re.sub(r"\s+", " ", cell).strip().replace("|", "\\|")
            if self.tables[-1]["row"] is None:
                self.tables[-1]["row"] = []
            self.tables[-1]["row"].append(cell)
        elif tag == "tr" and self.tables:
            table = self.tables[-1]
            if table["row"] is not None:
                table["rows"].append(table["row"])
                table["row"] = None
        elif tag == "table" and self.tables:
            self.emit_table(self.tables.pop())
        elif tag == "a" and self.links:
            href = self.links.pop()
            if href is not None:
                text = self.pop_buffer()
                label = text.strip()
                if label:
                    self.emit(f"[{label}]({href})" if not self.pre_depth else label)
                else:
                    self.emit(text)

    def handle_data(self, data):
        if self.skip_depth:
            return
        if self.pre_depth:
            self.emit(data)
        else:
            self.emit(re.sub(r"\s+", " ", data))

    def emit_table(self, table):
        rows = [row for row in table["rows"] if any(cell for cell in row)]
        if not rows:
            return
        width = max(len(row) for row in rows)
        rows = [row + [""] * (width - len(row)) for row in rows]
        if table["header"]:
            header, body = rows[0], rows[1:]
        else:
            header, body = [""] * width, rows
        lines = ["| " + " | ".join(header) + " |", "|" + "---|" * width]
        lines += ["| " + " | ".join(row) + " |" for row in body]
        self.emit("\n\n" + "\n".join(lines) + "\n\n")

    def result(self):
        while len(self.buffers) > 1:
            text = self.pop_buffer()
            self.emit(text)
        lines = []
        in_fence = False
        for line in "".join(self.buffers[0]).split("\n"):
            if line.strip().startswith("```"):
                if in_fence:
                    while lines and not lines[-1].strip():
                        lines.pop()
                in_fence = not in_fence
                lines.append(line.strip())
            elif in_fence:
                lines.append(line.rstrip())
            elif LIST_ITEM.match(line):
                indent, marker, rest = LIST_ITEM.match(line).groups()
                lines.append(indent + marker + " " + re.sub(r" {2,}", " ", rest).strip())
            else:
                lines.append(re.sub(r" {2,}", " ", line).strip())
        text = re.sub(r"\n{3,}", "\n\n", "\n".join(lines))
        return text.strip() + "\n"


def html_to_markdown(source):
    converter = MarkdownConverter()
    converter.feed(source)
    converter.close()
    return converter.result()


# ----------------------------------------------------------------- libraries

def library_dir(slug):
    return slug.split("~")[0]


def page_file(page):
    parts = [part for part in page.split("/") if part not in ("", ".", "..")]
    if not parts:
        parts = ["index"]
    relative = posixpath.join(*parts)
    return relative if relative.endswith(".md") else relative + ".md"


def write_library_readme(target, library, index):
    lines = [
        f"# {library['name']} {library.get('version') or ''}".rstrip(),
        "",
        f"- Slug: `{library['slug']}`",
        f"- Release: {library.get('release') or 'n/a'}",
        f"- Type: {library.get('type')}",
        f"- Source: {BASE_URL}/{library_dir(library['slug'])}/",
    ]
    attribution = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", library.get("attribution") or ""))).strip()
    if attribution:
        lines.append(f"- Attribution: {attribution}")
    lines += ["", "Start at [index.md](index.md).", ""]

    entries_by_type = {}
    for entry in index.get("entries", []):
        entries_by_type.setdefault(entry.get("type") or "(Other)", []).append(entry)

    lines += ["## Symbol index", ""]
    for type_info in index.get("types", []):
        name = type_info["name"]
        entries = entries_by_type.pop(name, [])
        if not entries:
            continue
        lines += [f"### {name}", ""]
        for entry in entries:
            path, sep, fragment = entry["path"].partition("#")
            link = page_file(path) + (sep + fragment if sep else "")
            lines.append(f"- [{entry['name']}]({link})")
        lines.append("")
    for name, entries in entries_by_type.items():
        lines += [f"### {name}", ""]
        for entry in entries:
            path, sep, fragment = entry["path"].partition("#")
            lines.append(f"- [{entry['name']}]({page_file(path) + (sep + fragment if sep else '')})")
        lines.append("")

    with open(os.path.join(target, "README.md"), "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines))


def sync_library(library):
    slug = library["slug"]
    directory = library_dir(slug)
    db = fetch_json(f"{BASE_URL}/docs/{slug}/db.json")
    index = fetch_json(f"{BASE_URL}/docs/{slug}/index.json")

    staging = os.path.join(DOCS_DIR, f".staging-{directory}")
    shutil.rmtree(staging, ignore_errors=True)
    os.makedirs(staging)

    written = set()
    for page, source in db.items():
        relative = page_file(page)
        # Guard against case-insensitive filesystem collisions (e.g. macOS).
        key = relative.lower()
        if key in written:
            stem = relative[:-3]
            counter = 2
            while f"{stem}~{counter}.md".lower() in written:
                counter += 1
            relative = f"{stem}~{counter}.md"
            key = relative.lower()
        written.add(key)

        path = os.path.join(staging, relative)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(html_to_markdown(source))

    write_library_readme(staging, library, index)

    target = os.path.join(DOCS_DIR, directory)
    shutil.rmtree(target, ignore_errors=True)
    os.rename(staging, target)
    return len(db)


def write_guide_readme(libraries):
    lines = [
        "# GNOME JavaScript Docs (offline mirror)",
        "",
        f"Markdown mirror of <{BASE_URL}>, produced by [`sync.sh`](sync.sh).",
        "Do not edit files under `docs/` by hand; they are overwritten on every sync.",
        "",
        "## Syncing",
        "",
        "```sh",
        "./guide/sync.sh                # sync libraries.txt, delete the rest (incremental)",
        "./guide/sync.sh 'st*' 'shell*' # sync only matching libraries",
        "./guide/sync.sh --force        # re-download regardless of upstream mtime",
        "./guide/sync.sh --list         # list every library available upstream",
        "```",
        "",
        "To add or drop a library, edit [`libraries.txt`](libraries.txt) and run `./guide/sync.sh`.",
        "",
        "## Layout",
        "",
        "- `docs/<dir>/README.md` — library metadata plus a full symbol index (grep here first)",
        "- `docs/<dir>/index.md` — the library's landing page",
        "- `docs/<dir>/<page>.md` — one file per class, interface, enum, etc. (e.g. `docs/st17/st.icon.md`)",
        "- Method, property and signal anchors are preserved, e.g. `st.icon.md#method-set_gicon`",
        "",
        "GNOME Shell version mapping for the Shell-specific libraries (St, Shell, Meta, Clutter, Cogl, Mtk):",
        "GNOME 48 = version 16, GNOME 49 = 17, GNOME 50 = 18, GNOME 51 = 19.",
        "",
        "## Libraries",
        "",
        "| Name | Version | Release | Directory |",
        "|---|---|---|---|",
    ]
    present = set(os.listdir(DOCS_DIR)) if os.path.isdir(DOCS_DIR) else set()
    for library in sorted(libraries, key=lambda item: (item["name"].lower(), item["slug"])):
        directory = library_dir(library["slug"])
        if directory in present:
            cell = f"[{directory}](docs/{directory}/README.md)"
            lines.append(f"| {library['name']} | {library.get('version') or ''} | {library.get('release') or ''} | {cell} |")
    lines.append("")
    with open(os.path.join(GUIDE_DIR, "README.md"), "w", encoding="utf-8") as handle:
        handle.write("\n".join(lines))


def load_allowlist():
    try:
        with open(ALLOWLIST_PATH, encoding="utf-8") as handle:
            lines = [line.split("#", 1)[0].strip() for line in handle]
    except FileNotFoundError:
        print(f"error: {ALLOWLIST_PATH} not found", file=sys.stderr)
        sys.exit(1)
    return [line for line in lines if line]


def load_manifest():
    try:
        with open(MANIFEST_PATH, encoding="utf-8") as handle:
            return json.load(handle)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_manifest(manifest):
    temporary = MANIFEST_PATH + ".tmp"
    with open(temporary, "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=2, sort_keys=True)
    os.replace(temporary, MANIFEST_PATH)


def main():
    parser = argparse.ArgumentParser(prog="sync.sh", description="Mirror gjs-docs.gnome.org as Markdown.")
    parser.add_argument("patterns", nargs="*", help="glob patterns matched against library slugs (e.g. 'st*')")
    parser.add_argument("--force", action="store_true", help="re-download even if unchanged upstream")
    parser.add_argument("--list", action="store_true", help="list available libraries and exit")
    parser.add_argument("--jobs", type=int, default=8, help="parallel downloads (default: 8)")
    args = parser.parse_args()

    libraries = fetch_json(f"{BASE_URL}/docs.json")

    if args.list:
        for library in sorted(libraries, key=lambda item: item["slug"]):
            size = library.get("db_size", 0) / 1e6
            print(f"{library['slug']:<32} {library['name']:<24} {library.get('release') or '':<12} {size:6.1f} MB")
        return 0

    os.makedirs(DOCS_DIR, exist_ok=True)
    with open(LIBRARIES_PATH, "w", encoding="utf-8") as handle:
        json.dump(libraries, handle, indent=2)

    for leftover in os.listdir(DOCS_DIR):
        if leftover.startswith(".staging-"):
            shutil.rmtree(os.path.join(DOCS_DIR, leftover), ignore_errors=True)

    manifest = load_manifest()
    patterns = args.patterns or load_allowlist()
    selected = [
        library for library in libraries
        if any(fnmatch.fnmatch(library["slug"], pattern) for pattern in patterns)
    ]
    if not selected:
        print("No libraries match the given patterns. Use --list to see available slugs.", file=sys.stderr)
        return 1

    pending = [
        library for library in selected
        if args.force
        or manifest.get(library["slug"]) != library.get("mtime")
        or not os.path.isdir(os.path.join(DOCS_DIR, library_dir(library["slug"])))
    ]

    # On a full sync, delete every library that is not in the allowlist (or no longer upstream).
    if not args.patterns:
        keep = {library_dir(library["slug"]) for library in selected}
        for directory in sorted(os.listdir(DOCS_DIR)):
            if directory not in keep and os.path.isdir(os.path.join(DOCS_DIR, directory)):
                shutil.rmtree(os.path.join(DOCS_DIR, directory))
                print(f"removed  {directory}")
        for slug in [slug for slug in manifest if library_dir(slug) not in keep]:
            del manifest[slug]
        save_manifest(manifest)

    print(f"{len(selected)} selected, {len(selected) - len(pending)} up to date, {len(pending)} to sync")

    lock = threading.Lock()
    failures = []
    done = 0
    with ThreadPoolExecutor(max_workers=max(1, args.jobs)) as pool:
        futures = {pool.submit(sync_library, library): library for library in pending}
        for future in as_completed(futures):
            library = futures[future]
            done += 1
            try:
                pages = future.result()
            except Exception as error:  # noqa: BLE001 - report and continue with the rest
                failures.append(library["slug"])
                print(f"[{done}/{len(pending)}] FAILED {library['slug']}: {error}", file=sys.stderr)
                continue
            with lock:
                manifest[library["slug"]] = library.get("mtime")
                save_manifest(manifest)
            print(f"[{done}/{len(pending)}] synced {library['slug']} ({pages} pages)")

    save_manifest(manifest)
    write_guide_readme(libraries)

    if failures:
        print(f"{len(failures)} libraries failed: {', '.join(sorted(failures))}. Re-run to retry.", file=sys.stderr)
        return 1
    print("Done.")
    return 0


sys.exit(main())
PY
