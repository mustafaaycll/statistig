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

import { StatistigQuickMenuToggle } from './toggle.js';
import { StatistigConfig } from './config.js';
import { StatistigMethods } from './methods.js';


export default class Statistig extends Extension {

    public config: StatistigConfig | null = null;
    public quickMenuToggle: StatistigQuickMenuToggle | null = null;

    enable() {
        this.config = new StatistigConfig(this.getSettings(), new StatistigMethods(this));
        if (this.config.basePath === 'none') {
            this.config.basePath = this.path;
        }

        this.quickMenuToggle = StatistigQuickMenuToggle.create(this.config);
        
        this.registerQuickMenuToggle();
        this.quickMenuToggle.emit('clicked', 0);
    }

    disable() {

        if (this.quickMenuToggle) {
            this.quickMenuToggle.destroy();
            this.quickMenuToggle = null;
        }

        // Ensure that the below if block is the last thing to be called
        if (this.config) {

            if (this.config.basePath !== 'none') {
                this.config.basePath = 'none';
            }

            this.config = null;
        }
    }

    registerQuickMenuToggle(): void {
        const quickSettings: any = Main.panel.statusArea.quickSettings;
        const backgroundAppsQuickMenuItem: any = quickSettings._backgroundApps?.quickSettingsItems?.at(-1) ?? null;
        quickSettings.menu.insertItemBefore(
            this.quickMenuToggle,
            backgroundAppsQuickMenuItem
        );
    }
}
