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
import { StatistigMethods } from './methods.js';

export class StatistigConfig {
    private _settings: Gio.Settings;
    private _methods: StatistigMethods | null;

    constructor(settings: Gio.Settings, methods: StatistigMethods | null) {
        this._settings = settings;
        this._methods = methods;
    }

    get methods(): StatistigMethods | null {
        return this._methods;
    }

    get basePath(): string {
        return this._settings.get_string('base-path');
    }

    set basePath(v: string) {
        this._settings.set_string('base-path', v);
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

    get procButtonEnabled(): boolean {
        return this._settings.get_boolean('proc-btn-enabled');
    }

    set procButtonEnabled(v: boolean) {
        this._settings.set_boolean('proc-btn-enabled', v);
    }

    get memMonitoringEnabled(): boolean {
        return this._settings.get_boolean('mem-mon-enabled');
    }

    set memMonitoringEnabled(v: boolean) {
        this._settings.set_boolean('mem-mon-enabled', v);
    }

    get memButtonEnabled(): boolean {
        return this._settings.get_boolean('mem-btn-enabled');
    }

    set memButtonEnabled(v: boolean) {
        this._settings.set_boolean('mem-btn-enabled', v);
    }

    get batteryButtonStyled(): boolean {
        return this._settings.get_boolean('bat-btn-styled');
    }

    set batteryButtonStyled(v: boolean) {
        this._settings.set_boolean('bat-btn-styled', v);
    }

    get screenshotButtonHidden(): boolean {
        return this._settings.get_boolean('scs-btn-hidden');
    }

    set screenshotButtonHidden(v: boolean) {
        this._settings.set_boolean('scs-btn-hidden', v);
    }

    get settingsButtonHidden(): boolean {
        return this._settings.get_boolean('stn-btn-hidden');
    }

    set settingsButtonHidden(v: boolean) {
        this._settings.set_boolean('stn-btn-hidden', v);
    }

    get lockButtonHidden(): boolean {
        return this._settings.get_boolean('lck-btn-hidden');
    }

    set lockButtonHidden(v: boolean) {
        this._settings.set_boolean('lck-btn-hidden', v);
    }

    connect(
        identifier:
            | 'base-path'
            | 'icon-theme'
            | 'proc-mon-enabled'
            | 'proc-btn-enabled'
            | 'mem-mon-enabled'
            | 'mem-btn-enabled'
            | 'bat-btn-styled'
            | 'scs-btn-hidden'
            | 'stn-btn-hidden'
            | 'lck-btn-hidden',
        callback: () => void
    ): number {
        return this._settings.connect(`changed::${identifier}`, callback);
    }

    disconnect(handlerId: number): void {
        this._settings.disconnect(handlerId);
    }
}