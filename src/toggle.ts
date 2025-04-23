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
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

import St from 'gi://St';
import GObject from 'gi://GObject';

import { StatistigConstants } from './constants.js';
import { StatistigConfig } from './config.js';
import { StatistigIcons } from './icons.js';
import { StatistigSystemIndicator } from './indicator.js';
import { StatistigMonitor } from './monitor.js';
import { StatistigSwitchMenu } from './switch.js';
import { StatistigConnections } from './connections.js';

export const StatistigQuickMenuToggle = GObject.registerClass(
    class StatistigQuickMenuToggle extends QuickSettings.QuickMenuToggle {

        public config: StatistigConfig | null = null;
        public monitor: StatistigMonitor | null = null;
        public indicators: StatistigSystemIndicator | null = null;
        public connections: StatistigConnections | null = null;
        public switches: StatistigSwitchMenu | null = null;
        public dropdown: PopupMenu.PopupSubMenuMenuItem | null = null;

        _init(params?: Partial<QuickSettings.QuickMenuToggle.ConstructorProps>): void {
            super._init(params);
        }

        static create(config: StatistigConfig): StatistigQuickMenuToggle {
            const ins = new this();

            ins.config = config;
            ins.connections = new StatistigConnections();
            ins.title = StatistigConstants.QuickMenuToggleTitle;
            ins.gicon = StatistigIcons.getStatistigSymbolicIcon(config.basePath);
            ins.menuEnabled = true;
            ins.connections.toggle = ins.connect('clicked', ins.toggle);

            ins.monitor = new StatistigMonitor();
            ins.connections.monitor.proc = ins.monitor.connect('notify::cpu-usage', () => {
                const cpu = ins.monitor!.cpu_usage;
                ins.indicators?.update('proc', cpu);
            });
            ins.connections.monitor.mem = ins.monitor.connect('notify::ram-usage', () => {
                const mem = ins.monitor!.ram_usage;
                ins.indicators?.update('mem', mem);
            });

            ins.switches = new StatistigSwitchMenu(ins.config);
            ins.connections.switch = ins.switches.connections;


            ins.menu.setHeader(StatistigIcons.getStatistigSymbolicIcon(config.basePath), 'Statistig');
            ins.menu.addMenuItem(ins.switches.proc);
            ins.menu.addMenuItem(ins.switches.mem);
            
            ins.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

            ins.dropdown = new PopupMenu.PopupSubMenuMenuItem(_("Theme"));
            ins.dropdown.insert_child_above(
                new St.Icon({
                    gicon: StatistigIcons.getStatistigThemeSymbolicIcon(ins.config.basePath)
                }),
                ins.dropdown.get_first_child()
            );
            ins.dropdown.menu.addAction('Adwaita', () => {
                if (!ins.config) return;
                ins.config.iconTheme = 'adwaita';
                ins.switches?.update();
            });
            ins.dropdown.menu.addAction('Papirus', () => {
                if (!ins.config) return;
                ins.config.iconTheme = 'papirus';
                ins.switches?.update();
            });
            ins.menu.addMenuItem(ins.dropdown);
            
            return ins;
        }

        public destroy(): void {
            if (this.connections) {
                if (this.connections.toggle) {
                    this.disconnect(this.connections.toggle);
                    this.connections.toggle = null;
                }
                if (this.connections.monitor) {
                    if (this.connections.monitor.proc) {
                        this.monitor?.disconnect(this.connections.monitor.proc);
                        this.connections.monitor.proc = null;
                    }
                    if (this.connections.monitor.mem) {
                        this.monitor?.disconnect(this.connections.monitor.mem);
                        this.connections.monitor.mem = null;
                    }
                }
                if (this.connections.switch) {
                    if (this.connections.switch.proc) {
                        this.switches?.proc.disconnect(this.connections.switch.proc);
                        this.connections.switch.proc = null;
                    }
                    if (this.connections.switch.mem) {
                        this.switches?.mem.disconnect(this.connections.switch.mem);
                        this.connections.switch.mem = null;
                    }
                }
            }
            if (this.monitor) {
                this.monitor.stop();
                this.monitor = null;
            }
            if (this.switches) {
                this.switches.proc.destroy();
                this.switches.mem.destroy();
                this.switches = null;
            }
            if (this.indicators) {
                this.indicators.destroy();
                this.indicators = null;
            }
            if (this.dropdown) {
                this.dropdown.destroy();
                this.dropdown = null;
            }
            super.destroy();
        }

        public toggle(_source: StatistigQuickMenuToggle, clicked_button: number) {
            _source.set_checked(!_source.get_checked());

            if (_source.get_checked()) {
                _source.indicators = StatistigSystemIndicator.create(_source.config!);

                Main.panel.statusArea.quickSettings.addExternalIndicator(
                    _source.indicators
                );

                _source.monitor?.start();

            } else {
                _source.monitor?.stop();
                _source.indicators?.destroy();
                _source.indicators = null;
            }
        }
    }
);

export type StatistigQuickMenuToggle = InstanceType<typeof StatistigQuickMenuToggle>;