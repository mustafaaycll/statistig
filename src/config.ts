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

    set iconTheme(v : string) {
        this._settings.set_string('icon-theme', v);
    }
    
    get procMonitoringEnabled() : boolean {
        return this._settings.get_boolean('proc-enabled');
    }
    
    set procMonitoringEnabled(v : boolean) {
        this._settings.set_boolean('proc-enabled', v);
    }
    
    get memMonitoringEnabled() : boolean {
        return this._settings.get_boolean('mem-enabled');
    }
    
    set memMonitoringEnabled(v : boolean) {
        this._settings.set_boolean('mem-enabled', v);
    }

    connect(identifier: 'icon-theme' | 'base-path' | 'proc-enabled' | 'mem-enabled', callback: () => void): number {
        return this._settings.connect(`changed::${identifier}`, callback);
    }

    disconnect(handlerId: number): void {
        this._settings.disconnect(handlerId);
    }    
}