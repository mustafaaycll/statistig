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
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';

import { StatistigIcons } from './icons.js';
import { StatistigConfig } from './config.js';


export const StatistigSystemIndicators = GObject.registerClass(
    class StatistigSystemIndicators extends QuickSettings.SystemIndicator {

        public connections: number[] = [];
        public config: StatistigConfig | null = null;
        public proc: St.Icon | null = null;
        public mem: St.Icon | null = null;
        public procLabel: St.Label | null = null;
        public memLabel: St.Label | null = null;
        private _lastProcRounded: string = '';
        private _lastMemRounded: string = '';

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
                }),
                this.config.connect('proc-lbl-enabled', () => {
                    this.toggleProc();
                }),
                this.config.connect('mem-lbl-enabled', () => {
                    this.toggleMem();
                }),
                this.config.connect('lbl-monospace', () => {
                    if (this.procLabel) this._applyLabelStyle(this.procLabel);
                    if (this.memLabel) this._applyLabelStyle(this.memLabel);
                }),
                this.config.connect('lbl-fixed-width', () => {
                    // Next update() call will use the new setting
                }),
                this.config.connect('lbl-alignment', () => {
                    // Next update() call will use the new setting
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
                this.connections.length = 0;
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

            this.procLabel = new St.Label({
                text: '',
                y_align: Clutter.ActorAlign.CENTER,
                visible: false,
            });
            this._applyLabelStyle(this.procLabel);
            this.proc.get_parent()?.add_child(this.procLabel);
        }

        public toggleProc(): void {
            if (!this.config || !this.proc) { return }

            if (this.config.procMonitoringEnabled) {
                this.proc.show();
                if (this.procLabel) {
                    if (this.config.procLabelEnabled) {
                        this.procLabel.show();
                    } else {
                        this.procLabel.hide();
                    }
                }
            } else {
                this.proc.hide();
                this.procLabel?.hide();
            }
        }

        public configureMem(): void {
            if (!this.config) { return }
            this.mem = this._addIndicator();
            this.mem.set_gicon(StatistigIcons.getStatistigSymbolicIcon(this.config.basePath));

            this.memLabel = new St.Label({
                text: '',
                y_align: Clutter.ActorAlign.CENTER,
                visible: false,
            });
            this._applyLabelStyle(this.memLabel);
            this.mem.get_parent()?.add_child(this.memLabel);
        }

        public toggleMem(): void {
            if (!this.config || !this.mem) { return }

            if (this.config.memMonitoringEnabled) {
                this.mem.show();
                if (this.memLabel) {
                    if (this.config.memLabelEnabled) {
                        this.memLabel.show();
                    } else {
                        this.memLabel.hide();
                    }
                }
            } else {
                this.mem.hide();
                this.memLabel?.hide();
            }
        }

        public update(identifier: string, value: number) {
            if (!this.config) { return }

            const roundedVal: string = (Math.round(value / 10) * 10).toString();

            if (identifier === 'proc' && this.proc && this.config.procMonitoringEnabled) {
                if (roundedVal !== this._lastProcRounded) {
                    this._lastProcRounded = roundedVal;
                    this.proc.set_gicon(StatistigIcons.getSystemIndicatorSymbolicIcon(
                        this.config.basePath,
                        this.config.iconTheme,
                        'proc',
                        roundedVal
                    ));
                }
                if (this.procLabel && this.config.procLabelEnabled) {
                    this.procLabel.set_text(this._formatValue(value));
                }
            }

            if (identifier === 'mem' && this.mem && this.config.memMonitoringEnabled) {
                if (roundedVal !== this._lastMemRounded) {
                    this._lastMemRounded = roundedVal;
                    this.mem.set_gicon(StatistigIcons.getSystemIndicatorSymbolicIcon(
                        this.config.basePath,
                        this.config.iconTheme,
                        'mem',
                        roundedVal
                    ));
                }
                if (this.memLabel && this.config.memLabelEnabled) {
                    this.memLabel.set_text(this._formatValue(value));
                }
            }
        }

        public resetIconCache(): void {
            this._lastProcRounded = '';
            this._lastMemRounded = '';
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
            if (this.procLabel) {
                this.procLabel.destroy();
                this.procLabel = null;
            }
            if (this.proc) {
                this.proc.destroy();
                this.proc = null;
            }
        }

        public destroyMemIndicator(): void {
            if (this.memLabel) {
                this.memLabel.destroy();
                this.memLabel = null;
            }
            if (this.mem) {
                this.mem.destroy();
                this.mem = null;
            }
        }

        private _applyLabelStyle(label: St.Label): void {
            if (!this.config) { return }
            let style = '';
            if (this.config.labelMonospace) {
                style += 'font-family: monospace;';
            }
            label.set_style(style || null);
        }

        private _formatValue(value: number): string {
            if (!this.config) { return '' }
            const text = `${value}%`;
            if (this.config.labelFixedWidth) {
                if (this.config.labelAlignment === 'left') {
                    return text.padEnd(4, ' ');
                }
                return text.padStart(4, ' ');
            }
            return text;
        }
    }
);

export type StatistigSystemIndicators = InstanceType<typeof StatistigSystemIndicators>;
