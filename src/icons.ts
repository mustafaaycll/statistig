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

import { StatistigConstants } from './constants.js';

export class StatistigIcons {
    
    static getStatistigSymbolicIcon(basePath: string): Gio.Icon {
        return Gio.icon_new_for_string(`${basePath}${StatistigConstants.IconsPath}${StatistigConstants.StatistigIconName}`);
    }

    static getStatistigThemeSymbolicIcon(basePath: string): Gio.Icon {
        return Gio.icon_new_for_string(`${basePath}${StatistigConstants.IconsPath}${StatistigConstants.StatistigThemeIconName}`);
    }

    static getSystemIndicatorSymbolicIcon(basePath: string, iconTheme: string, identifier: string, percentage: string | null): Gio.Icon {
        const iconPackPath: string = `${basePath}${StatistigConstants.IconsPath}symbolic/${iconTheme}/${identifier}/`;
        let iconName: string = `${identifier}-`;
        if (percentage !== null) {
            iconName = `${iconName}${percentage}-`;
        }
        iconName = `${iconName}symbolic.svg`;
        return Gio.icon_new_for_string(`${iconPackPath}${iconName}`);
    }
    
}