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

import GObject from 'gi://GObject';

import { StatistigIcons } from './icons.js';
import { StatistigConfig } from './config.js';

export const StatistigSystemButton = GObject.registerClass(
    class StatistigSystemButton extends QuickSettings.QuickToggle {
        public config: StatistigConfig | null = null;

        _init(params?: Partial<QuickSettings.QuickToggle.ConstructorProps>): void {
            super._init(params);
        }

        static create(config: StatistigConfig): StatistigSystemButton {
            const ins = new this();
            
            ins.add_style_class_name('power-item');
            ins.set_style('font-family: monospace');
            ins.set_x_expand(false);

            ins.config = config;
            ins.gicon = StatistigIcons.getStatistigSymbolicIcon(ins.config.basePath);
            ins.title = "-%".padEnd(3, ' ');
            return ins;
        }

        public update(identifier: string, value: number) {
            if (!this.config) { return }

            this.gicon = StatistigIcons.getSystemIndicatorSymbolicIcon(
                this.config.basePath,
                this.config.iconTheme,
                identifier,
                (Math.round(value / 10) * 10).toString()
            );
            this.title = `${value}%`.padEnd(3, ' ');
            
        }

        public destroy(): void {
            super.destroy();
        }
    }
);

export type StatistigSystemButton = InstanceType<typeof StatistigSystemButton>;