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

import Gio from 'gi://Gio';
import GObject from 'gi://GObject';

export class StatistigConfig {
    private _settings: Gio.Settings;

    constructor(settings: Gio.Settings) {
        this._settings = settings;
    }

    get iconTheme(): string {
        return this._settings.get_string('icon-theme');
    }

    set iconTheme(v: string) {
        this._settings.set_string('icon-theme', v);
    }

    get procMonitoringEnabled(): boolean {
        return this._settings.get_boolean('proc-mon-enabled');
    }

    set procMonitoringEnabled(v: boolean) {
        this._settings.set_boolean('proc-mon-enabled', v);
    }

    get memMonitoringEnabled(): boolean {
        return this._settings.get_boolean('mem-mon-enabled');
    }

    set memMonitoringEnabled(v: boolean) {
        this._settings.set_boolean('mem-mon-enabled', v);
    }

    get procLabelEnabled(): boolean {
        return this._settings.get_boolean('proc-lbl-enabled');
    }

    set procLabelEnabled(v: boolean) {
        this._settings.set_boolean('proc-lbl-enabled', v);
    }

    get memLabelEnabled(): boolean {
        return this._settings.get_boolean('mem-lbl-enabled');
    }

    set memLabelEnabled(v: boolean) {
        this._settings.set_boolean('mem-lbl-enabled', v);
    }

    get labelMonospace(): boolean {
        return this._settings.get_boolean('lbl-monospace');
    }

    set labelMonospace(v: boolean) {
        this._settings.set_boolean('lbl-monospace', v);
    }

    get labelFixedWidth(): boolean {
        return this._settings.get_boolean('lbl-fixed-width');
    }

    set labelFixedWidth(v: boolean) {
        this._settings.set_boolean('lbl-fixed-width', v);
    }

    get labelAlignment(): string {
        return this._settings.get_string('lbl-alignment');
    }

    set labelAlignment(v: string) {
        this._settings.set_string('lbl-alignment', v);
    }

    connect(
        identifier:
            | 'icon-theme'
            | 'proc-mon-enabled'
            | 'mem-mon-enabled'
            | 'proc-lbl-enabled'
            | 'mem-lbl-enabled'
            | 'lbl-monospace'
            | 'lbl-fixed-width'
            | 'lbl-alignment',
        callback: () => void,
    ): number {
        const handlerId = this._settings.connect(
            `changed::${identifier}`,
            callback,
        );
        // Gio.Settings only emits changed::<key> for keys that have been read
        // since a handler was connected, so read it once here.
        this._settings.get_value(identifier);
        return handlerId;
    }

    /** Binds a settings key to a GObject property (Gio.SettingsBindFlags.DEFAULT). */
    bind(
        key: 'monitoring-enabled',
        object: GObject.Object,
        property: string,
    ): void {
        this._settings.bind(
            key,
            object,
            property,
            Gio.SettingsBindFlags.DEFAULT,
        );
    }

    unbind(object: GObject.Object, property: string): void {
        Gio.Settings.unbind(object, property);
    }

    disconnect(handlerId: number): void {
        this._settings.disconnect(handlerId);
    }
}
