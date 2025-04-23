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

import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

import St from 'gi://St';
import GObject from 'gi://GObject';

import { StatistigConfig } from './config.js';
import { StatistigIcons } from './icons.js';

export const StatistigSwitchMenuItem = GObject.registerClass(
    class StatistigSwitchMenuItem extends PopupMenu.PopupSwitchMenuItem {
        public icon: St.Icon | null = null;
        public config: StatistigConfig | null = null;
        public identifier: string | null = null;

        _init(text: string, active: boolean, params?: PopupMenu.PopupSwitchMenuItem.ConstructorProps): void {
            super._init(text, active, params);
        }

        static create(config: StatistigConfig, identifier: string): StatistigSwitchMenuItem {
            const icon = new St.Icon();
            icon.set_gicon(StatistigIcons.getSystemIndicatorSymbolicIcon(
                config.basePath,
                config.iconTheme,
                identifier,
                null
            ));

            let text = "";
            let active = false;

            if (identifier === 'proc') {
                text = _("Processor");
                active = config.procMonitoringEnabled;
            } else if (identifier === 'mem') {
                text = _("Memory");
                active = config.memMonitoringEnabled;
            }

            
            const ins = new this(text, active);
            ins.config = config;
            ins.identifier = identifier;
            ins.icon = icon;
            ins.insert_child_below(ins.icon, ins.get_label_actor());

            return ins;
        }

        public updateIcon() {
            if (!this.config || !this.identifier || !this.icon) return;
            this.icon.set_gicon(StatistigIcons.getSystemIndicatorSymbolicIcon(
                this.config.basePath,
                this.config.iconTheme,
                this.identifier,
                null
            ));
        }

        destroy(): void {
            if (this.icon) {
                this.icon.destroy();
            }
            if (this.identifier) {
                this.identifier = null;
            }
            super.destroy();
        }
    }
)

export class StatistigSwitchMenu {
    public proc: InstanceType<typeof StatistigSwitchMenuItem>;
    public mem: InstanceType<typeof StatistigSwitchMenuItem>;

    public connections: {
        proc: number | null,
        mem: number | null
    } = {
        proc: null,
        mem: null
    };

    constructor(config: StatistigConfig) {
        this.proc = StatistigSwitchMenuItem.create(config, 'proc');
        this.mem = StatistigSwitchMenuItem.create(config, 'mem');
        this.connect();
    }

    public connect() {
        this.connections.proc = this.proc.connect('toggled', this.toggle);
        this.connections.mem = this.mem.connect('toggled', this.toggle);
    }

    public update() {
        this.proc.updateIcon();
        this.mem.updateIcon();
    }

    public toggle(_source: InstanceType<typeof StatistigSwitchMenuItem>, toggled: boolean) {
        if (!_source.config) return;
        if (_source.identifier === 'proc') {
            _source.config.procMonitoringEnabled = toggled;
        }
        if (_source.identifier === 'mem') {
            _source.config.memMonitoringEnabled = toggled;
        }
    }
}