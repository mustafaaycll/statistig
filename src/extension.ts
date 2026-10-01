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

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {StatistigConfig} from './config.js';
import {StatistigSystemIndicators} from './indicators.js';

export default class Statistig extends Extension {
    private _config: StatistigConfig | null = null;
    private _indicator: StatistigSystemIndicators | null = null;

    override enable() {
        this._config = new StatistigConfig(this.getSettings());
        this._indicator = new StatistigSystemIndicators(
            this._config,
            this.path,
            () => this.openPreferences(),
        );
        Main.panel.statusArea.quickSettings!.addExternalIndicator(
            this._indicator,
        );
    }

    override disable() {
        this._indicator?.destroy();
        this._indicator = null;
        this._config = null;
    }
}
