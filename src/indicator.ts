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

import St from 'gi://St';
import GObject from 'gi://GObject';

import { StatistigIcons } from './icons.js';
import { StatistigConfig } from './config.js';


export const StatistigSystemIndicator = GObject.registerClass(
    class StatistigSystemIndicator extends QuickSettings.SystemIndicator {

        public config: StatistigConfig | null = null;
        public indicators: {
            proc: St.Icon | null,
            mem: St.Icon | null
        } = {
            proc: null,
            mem: null
        }

        _init(): void {
            super._init()            
        }

        static create(config: StatistigConfig): StatistigSystemIndicator {
            const ins = new this();
            ins.config = config;
            ins.setupIndicators();
            return ins;
        }

        public setupIndicators() {
            if (!this.config) { return }

            if (this.config.procMonitoringEnabled) {
                this.addProcIndicator();
            } else {
                this.destroyProcIndicator();
            }

            if (this.config.memMonitoringEnabled) {
                this.addMemIndicator();
            } else {
                this.destroyMemIndicator();
            }
        }

        public update(identifier: string, value: number) {
            if (!this.config) { return }

            const roundedVal: string = (Math.round(value / 10) * 10).toString();
            if (identifier === 'proc') {
                if (this.indicators.proc) {
                    if (this.config.procMonitoringEnabled) {
                        this.indicators.proc.set_gicon(StatistigIcons.getSystemIndicatorSymbolicIcon(
                            this.config.basePath,
                            this.config.iconTheme,
                            'proc',
                            roundedVal
                        ));
                    } else {
                        this.destroyProcIndicator();
                    }
                    
                } else {
                    if (this.config.procMonitoringEnabled) {
                        this.addProcIndicator();
                    }
                }
                
            }

            if (identifier === 'mem') {
                if (this.indicators.mem) {
                    if (this.config.memMonitoringEnabled) {
                        this.indicators.mem.set_gicon(StatistigIcons.getSystemIndicatorSymbolicIcon(
                            this.config.basePath,
                            this.config.iconTheme,
                            'mem',
                            roundedVal
                        ));
                    } else {
                        this.destroyMemIndicator();
                    }
                } else {
                    if (this.config.memMonitoringEnabled) {
                        this.addMemIndicator();
                    }
                }
                
            }
        }

        public destroy(): void {
            this.destroyProcIndicator();
            this.destroyMemIndicator();
        
            if (this.config) {
                this.config = null;
            }

            super.destroy();
        }

        public addProcIndicator(): void {
            if (!this.config) { return }
            if (!this.indicators.proc) {
                this.indicators.proc = this._addIndicator();
                this.indicators.proc.set_gicon(StatistigIcons.getSystemIndicatorSymbolicIcon(
                    this.config.basePath,
                    this.config.iconTheme,
                    'proc',
                    null
                ));
            }
        }

        public destroyProcIndicator(): void {
            if (this.indicators.proc) {
                this.indicators.proc.destroy();
                this.indicators.proc = null;
            }
        }

        public addMemIndicator(): void {
            if (!this.config) { return }
            this.indicators.mem = this._addIndicator();
            this.indicators.mem.set_gicon(StatistigIcons.getSystemIndicatorSymbolicIcon(
                this.config.basePath,
                this.config.iconTheme,
                'mem',
                null
            ));
        }

        public destroyMemIndicator(): void {
            if (this.indicators.mem) {
                this.indicators.mem.destroy();
                this.indicators.mem = null;
            }
        }
        
    }
);

export type StatistigSystemIndicator = InstanceType<typeof StatistigSystemIndicator>;