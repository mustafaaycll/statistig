# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Statistig is a GNOME Shell extension (TypeScript) that displays real-time CPU and memory usage in the GNOME status area / quick settings panel. Targets GNOME 47–48.

## Commands

```bash
npm run build              # Build extension as zip package
npm run build:install      # Build and install to ~/.local/share/gnome-shell/extensions/
npm run build:dev          # Build and reload GNOME Shell (requires X11 + unsafe mode)
npm run check:format       # Prettier format check
npm run check:types        # TypeScript type check (no emit)
npm run translations:update  # Update .po translation files
```

There are no automated tests. Validation is type check only (`npm run check:types`).

## Architecture

The extension lifecycle flows through `extension.ts` → `toggle.ts` (StatistigQuickMenuToggle), which owns and coordinates:

- **`monitor.ts`** — GObject polling `/proc/stat` and `/proc/meminfo` every second; emits `notify::cpu-usage` and `notify::ram-usage` signals
- **`indicators.ts`** — Adds icon indicators (with optional numeric labels) to the GNOME status bar
- **`config.ts`** — Typed wrapper around `Gio.Settings` (GSettings schema in `src/schemas/`)
- **`connections.ts`** — Tracks all signal connections for clean teardown on disable
- **`prefs.ts`** — Settings UI (separate process from the shell extension)

### Signal flow

`StatistigMonitor` emits property-change notifications → `StatistigSystemIndicators` listens and updates icons and labels. `StatistigConfig` connects to GSettings and re-applies settings reactively.

### Icons

Symbolic SVG icons live in `src/icons/symbolic/{adwaita,papirus,yaru}/{proc,mem}/` with variants at 10% increments (0–100). Copies also exist in `resources/icons/crafted/`. The active icon pack is controlled by the `icon-theme` GSetting. Color thresholds: normal → warning (yellow) at 70% → error (red) at 90%.

Each theme has distinct visual characteristics:
- **Adwaita**: dark (`#222222`), thick 2px outlines, r=3 corners
- **Papirus**: colorful with opacity layers, rounded pill-shaped pins
- **Yaru**: gray (`#808080`), thin 1px outlines, r=2 corners

### GSettings schema

`src/schemas/org.gnome.shell.extensions.statistig.gschema.xml` defines all settings. The `base-path` key is set at install time so the extension can locate its icon assets at runtime.

### Translations

Translation files are in `po/`. Supported locales: bg, de, el, en_UK, en_US, es, fr, it, tr. The `LINGUAS` file lists enabled locales. The `.pot` template must stay in sync with translatable strings in source (grep for `_('...')` calls).

## Key constraints

- **GNOME Shell JS environment**: No Node.js APIs. Use GLib/Gio for I/O. All imports are GNOME introspection (`gi://`) or relative TypeScript modules.
- **TypeScript strict mode** is enabled. Run `npm run check:types` before committing.
- **esbuild** (not tsc) produces the final JS output in ESM format. The `scripts/esbuild.js` config controls bundling.
- The preferences UI (`prefs.ts`) runs in a separate process from the shell extension — avoid shared mutable state.
