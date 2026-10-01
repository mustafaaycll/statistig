# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Statistig is a GNOME Shell extension (TypeScript) that displays real-time CPU and memory usage in the status area of the GNOME top bar, next to the system indicators and quick settings. Version 6 (in development) targets GNOME 50 and 51 (`shell-version` in `metadata.json`); version 5, already published, covers GNOME 48–50.

The extension deliberately follows GNOME's design guidelines: indicators belong only in the status area. Never add widgets to other parts of the panel (left/center boxes or the gaps between panel elements).

## Commands

```bash
npm run build              # Type check, compile and package the extension as a zip (works on Linux and macOS)
npm run build:install      # Build and install to ~/.local/share/gnome-shell/extensions/
npm run build:dev          # Build, install, and print how to load it (nested shell: dbus-run-session gnome-shell --devkit --wayland on GNOME 49+)
npm run format             # Prettier: rewrite src/ and scripts/ in place
npm run check:format       # Prettier: check src/ and scripts/ without writing
npm run check:types        # TypeScript type check (no emit)
npm run check:lint         # ESLint with GNOME Shell's rules (eslint-config-gnome) + typescript-eslint
npm run translations:update  # Update .po translation files
```

There are no automated tests. Validation is `npm run check:types`, `npm run check:lint` and `npm run check:format` (the build runs the first two); runtime behaviour needs a manual check in a GNOME session.

## Architecture

The extension lifecycle flows through `extension.ts` → `indicators.ts` (`StatistigSystemIndicators`, a `QuickSettings.SystemIndicator`). `enable()` creates it and registers it once with `Main.panel.statusArea.quickSettings.addExternalIndicator`; `disable()` destroys it. It owns:

- **the status icons and labels**: one icon and optional numeric label each for CPU and memory
- **`monitor.ts`**: a GObject polling `/proc/stat` and `/proc/meminfo` every second while active; emits `notify::cpu-usage` and `notify::ram-usage`
- **`toggle.ts`**: `StatistigQuickMenuToggle`, a plain `QuickMenuToggle` (`toggleMode: true`) that switches monitoring on/off and opens the preferences

Supporting modules:

- **`config.ts`**: typed wrapper around `Gio.Settings` (GSettings schema in `src/schemas/`); `connect()` reads the key once after connecting, because `changed::<key>` only fires for keys that have been read
- **`file.ts`**: `readTextFile()`, a synchronous reader for the `/proc` files
- **`prefs.ts`**: settings UI (separate process from the shell extension)

### Signal flow

`StatistigMonitor` emits property-change notifications → `StatistigSystemIndicators` updates icons and labels. The toggle's `notify::checked` starts/stops the monitor and shows/hides the indicators. `StatistigConfig.connect()` subscribes to `changed::<key>` and the indicator re-applies settings immediately. Every handler is disconnected in `StatistigSystemIndicators.destroy()`.

### Icons

Symbolic SVG icons live in `src/icons/symbolic/{adwaita,papirus,yaru}/{proc,mem}/` with variants at 10% increments (0–100). Copies also exist in `resources/icons/crafted/`. The active icon pack is controlled by the `icon-theme` GSetting. Color thresholds: normal → warning (yellow) at 70% → error (red) at 90%.

Each theme has distinct visual characteristics:
- **Adwaita**: dark (`#222222`), thick 2px outlines, r=3 corners
- **Papirus**: colorful with opacity layers, rounded pill-shaped pins
- **Yaru**: gray (`#808080`), thin 1px outlines, r=2 corners

### GSettings schema

`src/schemas/org.gnome.shell.extensions.statistig.gschema.xml` defines all settings. `monitoring-enabled` is bound to the quick-settings toggle's `checked` property, so the on/off state survives lock/unlock. Icon paths are derived from `Extension.path` / `ExtensionPreferences.path` at runtime; never store paths in GSettings. In `prefs.ts`, switch rows are bound with `Gio.Settings.bind`, and combo rows fall back to the key's default for unknown stored values.

### Translations

Translation files are in `po/`. Supported locales: bg, de, el, en_GB, en_US, es, fr, it, tr. The `LINGUAS` file lists enabled locales and must match the `po/*.po` files. `po/statistig.pot` is generated: `npm run translations:update` extracts every `_('...')` call from `src/*.ts`, then merges the template into each `.po` file and drops obsolete entries. Run it whenever a translatable string changes.

## API reference (`guide/`)

`guide/` holds an offline Markdown mirror of https://gjs-docs.gnome.org. Consult it before guessing at GJS/GObject APIs.

- `guide/docs/<library>/README.md` — full symbol index for a library (grep here first); one `<page>.md` per class, e.g. `guide/docs/st17/st.icon.md#method-set_gicon`
- `guide/libraries.txt` — allowlist of mirrored libraries: GJS guide, St and Clutter versions 17–19 (17 = GNOME 49, 18 = GNOME 50, 19 = GNOME 51; only 17 is published upstream so far and serves as the fallback until 18/19 appear), GObject, GLib, Gio, Gtk 4, Adw 1
- `./guide/sync.sh` — syncs the allowlist and deletes everything else; `--list` shows all upstream libraries, `--force` re-downloads

The generated files (`guide/docs/`, `guide/libraries.json`, `guide/.manifest.json`) are gitignored, so run `./guide/sync.sh` after a fresh clone. `.cbmignore` keeps `guide/` out of the codebase-memory index.

## Key constraints

- **GNOME Shell JS environment**: No Node.js APIs. Use GLib/Gio for I/O. All imports are GNOME introspection (`gi://`) or relative TypeScript modules.
- **TypeScript strict mode** is enabled, plus `noUnusedLocals`, `noUnusedParameters`, `noImplicitOverride` (mark overridden `enable`/`disable`/`destroy`/`vfunc_*` members with `override`), `noFallthroughCasesInSwitch` and `forceConsistentCasingInFileNames`. Run `npm run check:types` before committing; don't silence errors with `@ts-ignore`.
- Type definitions come from `@girs/gnome-shell` (GNOME 50 line); `@girs/gjs` must stay on the 4.x line required by it.
- GObject subclasses are declared as `export class X extends ... { static { GObject.registerClass(this); } ... }` (or `GObject.registerClass({GTypeName, Properties, ...}, this)` when they need meta info, as `StatistigMonitor` does). Don't use `const X = GObject.registerClass(class X ...)`: its `@girs` type drops static members and ESLint flags the shadowed name.
- `disable()` must undo everything `enable()` did and stay synchronous (GNOME 51 throws on an async `disable()`).
- Don't override `vfunc_dispose`/`vfunc_finalize` in JS GObject subclasses: they run during garbage collection, where GJS blocks them and logs "Attempting to run a JS callback during garbage collection". Do cleanup explicitly from `destroy()` (e.g. `StatistigMonitor.stop()`).
- **esbuild** (not tsc) produces the final JS output in ESM format. The `scripts/esbuild.js` config controls bundling; esbuild drops comments, so it adds a GPL notice banner to every output file.
- **Shipped attribution**: the icons derive from Adwaita, Papirus and Yaru; `src/icons/ATTRIBUTION.md` ships in the zip and must stay in sync with the README credits.
- The preferences UI (`prefs.ts`) runs in a separate process from the shell extension — avoid shared mutable state.
