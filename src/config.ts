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

export class StatistigConfig {
    private _settigns: Gio.Settings;

    constructor(settings: Gio.Settings) {
        this._settigns = settings;
    }

    get basePath(): string {
        return this._settigns.get_string('base-path');
    }

    set basePath(v: string) {
        this._settigns.set_string('base-path', v);
    }

    get iconTheme(): string {
        return this._settigns.get_string('icon-theme');
    }

    set iconTheme(v : string) {
        this._settigns.set_string('icon-theme', v);
    }
    
    get procMonitoringEnabled() : boolean {
        return this._settigns.get_boolean('proc-enabled');
    }
    
    set procMonitoringEnabled(v : boolean) {
        this._settigns.set_boolean('proc-enabled', v);
    }
    
    get memMonitoringEnabled() : boolean {
        return this._settigns.get_boolean('mem-enabled');
    }
    
    set memMonitoringEnabled(v : boolean) {
        this._settigns.set_boolean('mem-enabled', v);
    }
}