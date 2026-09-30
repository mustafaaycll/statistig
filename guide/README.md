# GNOME JavaScript Docs (offline mirror)

Markdown mirror of <https://gjs-docs.gnome.org>, produced by [`sync.sh`](sync.sh).
Do not edit files under `docs/` by hand; they are overwritten on every sync.

## Syncing

```sh
./guide/sync.sh                # sync libraries.txt, delete the rest (incremental)
./guide/sync.sh 'st*' 'shell*' # sync only matching libraries
./guide/sync.sh --force        # re-download regardless of upstream mtime
./guide/sync.sh --list         # list every library available upstream
```

To add or drop a library, edit [`libraries.txt`](libraries.txt) and run `./guide/sync.sh`.

## Layout

- `docs/<dir>/README.md` — library metadata plus a full symbol index (grep here first)
- `docs/<dir>/index.md` — the library's landing page
- `docs/<dir>/<page>.md` — one file per class, interface, enum, etc. (e.g. `docs/st16/st.icon.md`)
- Method, property and signal anchors are preserved, e.g. `st.icon.md#method-set_gicon`

GNOME Shell version mapping for the Shell-specific libraries (St, Shell, Meta, Clutter, Cogl, Mtk):
GNOME 48 = version 16, GNOME 49 = 17, GNOME 50 = 18, GNOME 51 = 19.

## Libraries

| Name | Version | Release | Directory |
|---|---|---|---|
| Adw | 1 | 1.8.0 | [adw1](docs/adw1/README.md) |
| Clutter | 16 | 16 API | [clutter16](docs/clutter16/README.md) |
| Clutter | 17 | 17 API | [clutter17](docs/clutter17/README.md) |
| Gio | 2.0 | 2.84+ | [gio20](docs/gio20/README.md) |
| GJS |  |  | [gjs](docs/gjs/README.md) |
| GLib | 2.0 | 2.86.0 | [glib20](docs/glib20/README.md) |
| GObject | 2.0 | 2.84+ | [gobject20](docs/gobject20/README.md) |
| Gtk | 4.0 | 4.20.1 | [gtk40](docs/gtk40/README.md) |
| St | 16 | 16 API | [st16](docs/st16/README.md) |
| St | 17 | 17 API | [st17](docs/st17/README.md) |
