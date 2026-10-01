// Copyright (C) 2025 Mustafa Yücel <mustafayucel.cs@gmail.com>

// This file is part of Statistig.

// Statistig is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Statistig is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Statistig. If not, see <https://www.gnu.org/licenses/>.

import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';

import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';

import {StatistigIcons} from './icons.js';
import {StatistigConfig} from './config.js';
import {StatistigMonitor} from './monitor.js';
import {StatistigQuickMenuToggle} from './toggle.js';

type Identifier = 'proc' | 'mem';

interface Indicator {
    icon: St.Icon;
    label: St.Label;
    value: number | null;
    rounded: string;
}

/**
 * Owns the status-area icons and labels, the resource monitor and the
 * quick-settings toggle that switches monitoring on and off.
 */
export class StatistigSystemIndicators extends QuickSettings.SystemIndicator {
    static {
        GObject.registerClass(this);
    }

    private _config: StatistigConfig;
    private _basePath: string;
    private _monitor: StatistigMonitor;
    private _toggle: StatistigQuickMenuToggle;
    private _indicators: Record<Identifier, Indicator>;
    private _configHandlers: number[] = [];
    private _monitorHandlers: number[] = [];

    constructor(
        config: StatistigConfig,
        basePath: string,
        openPreferences: () => void,
    ) {
        super();

        this._config = config;
        this._basePath = basePath;
        this._indicators = {
            proc: this._createIndicator(),
            mem: this._createIndicator(),
        };

        this._monitor = new StatistigMonitor();
        this._toggle = new StatistigQuickMenuToggle(basePath, openPreferences);
        this.quickSettingsItems.push(this._toggle);
        // Persist the on/off state across lock/unlock and restarts. The binding
        // also sets the initial value.
        config.bind('monitoring-enabled', this._toggle, 'checked');

        this._bind();
        this._toggle.connect('notify::checked', () => this._syncActive());
        this._syncActive();
    }

    private _createIndicator(): Indicator {
        const icon = this._addIndicator();
        const label = new St.Label({
            y_align: Clutter.ActorAlign.CENTER,
            visible: false,
        });
        this.add_child(label);
        return {icon, label, value: null, rounded: ''};
    }

    private _bind(): void {
        const config = this._config;
        this._configHandlers.push(
            config.connect('icon-theme', () => this.refresh()),
            config.connect('proc-mon-enabled', () => this._sync('proc')),
            config.connect('mem-mon-enabled', () => this._sync('mem')),
            config.connect('proc-lbl-enabled', () => this._sync('proc')),
            config.connect('mem-lbl-enabled', () => this._sync('mem')),
            config.connect('lbl-monospace', () => this._applyLabelStyle()),
            config.connect('lbl-fixed-width', () => this.refresh()),
            config.connect('lbl-alignment', () => this.refresh()),
        );
        this._applyLabelStyle();

        this._monitorHandlers.push(
            this._monitor.connect('notify::cpu-usage', () =>
                this._update('proc', this._monitor.cpu_usage),
            ),
            this._monitor.connect('notify::ram-usage', () =>
                this._update('mem', this._monitor.ram_usage),
            ),
        );
    }

    private _syncActive(): void {
        if (this._toggle.checked) {
            this._monitor.start();
        } else {
            this._monitor.stop();
            // Show the neutral glyph until fresh samples arrive.
            this._indicators.proc.value = null;
            this._indicators.mem.value = null;
        }
        this._sync('proc');
        this._sync('mem');
    }

    private _sync(identifier: Identifier): void {
        const {icon, label} = this._indicators[identifier];
        const iconVisible =
            this._toggle.checked &&
            (identifier === 'proc'
                ? this._config.procMonitoringEnabled
                : this._config.memMonitoringEnabled);
        const labelVisible =
            iconVisible &&
            (identifier === 'proc'
                ? this._config.procLabelEnabled
                : this._config.memLabelEnabled);

        label.visible = labelVisible;
        icon.visible = iconVisible;
        // Labels are not tracked by SystemIndicator, so re-check the box.
        this._syncIndicatorsVisible();
        this._render(identifier);
    }

    private _update(identifier: Identifier, value: number): void {
        this._indicators[identifier].value = value;
        this._render(identifier);
    }

    /** Re-renders both indicators from the last known values, e.g. after a setting change. */
    public refresh(): void {
        this._indicators.proc.rounded = '';
        this._indicators.mem.rounded = '';
        this._render('proc');
        this._render('mem');
    }

    private _render(identifier: Identifier): void {
        const indicator = this._indicators[identifier];
        const {value} = indicator;

        // Before the first sample, show the theme's neutral glyph. Flooring
        // makes the icon turn yellow exactly at 70% and red exactly at 90%.
        const rounded =
            value === null ? null : (Math.floor(value / 10) * 10).toString();
        const cacheKey = rounded ?? 'none';

        // Only swap the icon when the decile changes, to avoid creating a new
        // Gio.FileIcon every second.
        if (cacheKey !== indicator.rounded) {
            indicator.rounded = cacheKey;
            indicator.icon.set_gicon(
                StatistigIcons.getSystemIndicatorSymbolicIcon(
                    this._basePath,
                    this._config.iconTheme,
                    identifier,
                    rounded,
                ),
            );
        }

        indicator.label.set_text(
            value === null ? '' : this._formatValue(value),
        );
    }

    private _applyLabelStyle(): void {
        const style = this._config.labelMonospace
            ? 'font-family: monospace;'
            : null;
        this._indicators.proc.label.set_style(style);
        this._indicators.mem.label.set_style(style);
    }

    private _formatValue(value: number): string {
        const text = `${value}%`;
        if (this._config.labelFixedWidth) {
            if (this._config.labelAlignment === 'left') {
                return text.padEnd(4, ' ');
            }
            return text.padStart(4, ' ');
        }
        return text;
    }

    public override destroy(): void {
        for (const id of this._configHandlers) {
            this._config.disconnect(id);
        }
        this._configHandlers = [];
        for (const id of this._monitorHandlers) {
            this._monitor.disconnect(id);
        }
        this._monitorHandlers = [];
        this._monitor.stop();

        // The binding would otherwise live until the toggle is garbage collected.
        this._config.unbind(this._toggle, 'checked');
        for (const item of this.quickSettingsItems) {
            item.destroy();
        }
        this.quickSettingsItems = [];

        super.destroy();
    }
}
