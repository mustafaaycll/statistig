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
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

import GObject from 'gi://GObject';

import {StatistigConstants} from './constants.js';
import {StatistigIcons} from './icons.js';

export class StatistigQuickMenuToggle extends QuickSettings.QuickMenuToggle {
    static {
        GObject.registerClass(this);
    }

    constructor(basePath: string, openPreferences: () => void) {
        super({
            title: StatistigConstants.QuickMenuToggleTitle,
            gicon: StatistigIcons.getStatistigSymbolicIcon(basePath),
            toggleMode: true,
            menuEnabled: true,
        });

        this.menu.setHeader(
            StatistigIcons.getStatistigSymbolicIcon(basePath),
            'Statistig',
        );
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addAction(_('Statistig Settings'), openPreferences);
    }
}
