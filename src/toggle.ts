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
import { gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';

import GObject from 'gi://GObject';

import { StatistigConstants } from './constants.js';
import { StatistigConfig } from './config.js';
import { StatistigIcons } from './icons.js';
import { StatistigSystemIndicators } from './indicators.js';
import { StatistigMonitor } from './monitor.js';
import { StatistigSwitchMenu } from './switch.js';
import { StatistigConnections } from './connections.js';
import { StatistigSystemButtons } from './buttons.js';

export const StatistigQuickMenuToggle = GObject.registerClass(
    class StatistigQuickMenuToggle extends QuickSettings.QuickMenuToggle {

        public config: StatistigConfig | null = null;
        public monitor: StatistigMonitor | null = null;
        public indicators: StatistigSystemIndicators | null = null;
        public connections: StatistigConnections | null = null;
        public buttons: StatistigSystemButtons | null = null;

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
            
            ins.menu.setHeader(StatistigIcons.getStatistigSymbolicIcon(config.basePath), 'Statistig');
            ins.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
            ins.menu.addAction(_("Statistig Settings"), () => {
                ins.config?.methods?.openPreferences();
            });

            ins.connections.toggle.push(
                ins.connect('clicked', ins.toggle)
            );
            
            return ins;
        }

        public bind(): void {
            if (!this.connections || !this.monitor || !this.config) { return }

            this.connections.monitor.push(
                this.monitor.connect('notify::cpu-usage', () => {
                    const cpu = this.monitor!.cpu_usage;
                    this.indicators?.update('proc', cpu);
                    this.buttons?.update('proc', cpu);
                }),
                this.monitor.connect('notify::ram-usage', () => {
                    const mem = this.monitor!.ram_usage;
                    this.indicators?.update('mem', mem);
                    this.buttons?.update('mem', mem);
                })
            );

            this.connections.config.push(
                this.config.connect('icon-theme', () => {
                    this.indicators?.update('proc', this.monitor?.cpu_usage ?? 0);
                    this.indicators?.update('mem', this.monitor?.ram_usage ?? 0);
                    this.buttons?.update('proc', this.monitor?.cpu_usage ?? 0);
                    this.buttons?.update('mem', this.monitor?.ram_usage ?? 0);
                })
            );
        }

        public unbind(complete: boolean = true): void {
            if (this.connections) {
                for (let i = 0; i < this.connections.config.length; i++) {
                    const c = this.connections.config[i];
                    this.config?.disconnect(c);
                }
                for (let i = 0; i < this.connections.monitor.length; i++) {
                    const c = this.connections.monitor[i];
                    this.monitor?.disconnect(c);
                }
                if (complete) {
                    for (let i = 0; i < this.connections!.toggle.length; i++) {
                        const c = this.connections!.toggle[i];
                        this.disconnect(c);
                    }
                }
            }
        }

        public destroy(): void {
            this.destroyMonitor();
            this.destroyIndicators();
            this.destroyButtons();
            this.unbind();
            super.destroy();

        }

        public destroyMonitor(): void {
            if (this.monitor) {
                this.monitor.stop();
                this.monitor = null;
            }
        }

        public destroyIndicators(): void {
            if (this.indicators) {
                this.indicators.destroy();
                this.indicators = null;
            }
        }

        public destroyButtons(): void {
            if (this.buttons) {
                this.buttons.destroy();
                this.buttons = null;
            }
        }

        public toggle(_source: StatistigQuickMenuToggle, clicked_button: number) {
            _source.set_checked(!_source.get_checked());

            if (_source.get_checked()) {
                _source.indicators = StatistigSystemIndicators.create(_source.config!);
                _source.indicators.show();

                _source.buttons = StatistigSystemButtons.create(_source.config!);
                _source.buttons.show();

                _source.monitor = new StatistigMonitor();
                _source.monitor?.start();

                _source.bind();

            } else {
                _source.destroyMonitor();
                _source.destroyButtons();
                _source.destroyIndicators();
                _source.unbind(false);
            }
        }
    }
);

export type StatistigQuickMenuToggle = InstanceType<typeof StatistigQuickMenuToggle>;