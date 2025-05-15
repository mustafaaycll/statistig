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

import St from 'gi://St';
import GObject from 'gi://GObject';

import { StatistigIcons } from './icons.js';
import { StatistigConfig } from './config.js';


export const StatistigSystemIndicators = GObject.registerClass(
    class StatistigSystemIndicators extends QuickSettings.SystemIndicator {

        public connections: number[] = [];
        public config: StatistigConfig | null = null;
        public proc: St.Icon | null = null;
        public mem: St.Icon | null = null;

        _init(): void {
            super._init()            
        }

        static create(config: StatistigConfig): StatistigSystemIndicators {
            const ins = new this();
            ins.config = config;
            ins.bind();
            return ins;
        }

        public bind(): void {
            if (!this.config) { return }

            this.connections.push(
                this.config.connect('proc-mon-enabled', () => {
                    this.toggleProc();
                }),
                this.config.connect('mem-mon-enabled', () => {
                    this.toggleMem();
                })
            );
        }

        public unbind(connection: number | null = null): void {
            if (!this.config) { return }
            if (connection) {
                this.config.disconnect(connection);
            } else if (this.connections) {
                for (let i = 0; i < this.connections.length; i++) {
                    const c = this.connections[i];
                    this.config.disconnect(c);
                }
            }
        }

        public show(): void {
            if (!this.config) { return }
            this.configureProc();
            this.configureMem();
            Main.panel.statusArea.quickSettings.addExternalIndicator(this);
            this.toggleProc();
            this.toggleMem();
        }

        public configureProc(): void {
            if (!this.config) { return }
            this.proc = this._addIndicator();
            this.proc.set_gicon(StatistigIcons.getStatistigSymbolicIcon(this.config.basePath));
        }
        
        public toggleProc(): void {
            if (!this.config || !this.proc) { return }

            if (this.config.procMonitoringEnabled) {
                this.proc.show();
            } else {
                this.proc.hide();
            }
        }

        public configureMem(): void {
            if (!this.config) { return }
            this.mem = this._addIndicator();
            this.mem.set_gicon(StatistigIcons.getStatistigSymbolicIcon(this.config.basePath));
        }

        public toggleMem(): void {
            if (!this.config || !this.mem) { return }

            if (this.config.memMonitoringEnabled) {
                this.mem.show();
            } else {
                this.mem.hide();
            }
        }

        public update(identifier: string, value: number) {
            if (!this.config) { return }

            const roundedVal: string = (Math.round(value / 10) * 10).toString();
            
            if (identifier === 'proc' && this.proc && this.config.procMonitoringEnabled) {
                this.proc.set_gicon(StatistigIcons.getSystemIndicatorSymbolicIcon(
                    this.config.basePath,
                    this.config.iconTheme,
                    'proc',
                    roundedVal
                ));
                
            }

            if (identifier === 'mem' && this.mem && this.config.memMonitoringEnabled) {
                this.mem.set_gicon(StatistigIcons.getSystemIndicatorSymbolicIcon(
                    this.config.basePath,
                    this.config.iconTheme,
                    'mem',
                    roundedVal
                ));
            }
        }

        public destroy(): void {
            this.destroyProcIndicator();
            this.destroyMemIndicator();
            this.unbind();

            if (this.config) {
                this.config = null;
            }

            super.destroy();
        }

        public destroyProcIndicator(): void {
            if (this.proc) {
                this.proc.destroy();
                this.proc = null;
            }
        }

        public destroyMemIndicator(): void {
            if (this.mem) {
                this.mem.destroy();
                this.mem = null;
            }
        }
        
    }
);

export type StatistigSystemIndicators = InstanceType<typeof StatistigSystemIndicators>;