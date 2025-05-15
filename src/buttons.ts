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

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { StatistigSystemButton } from './button.js';
import { StatistigConfig } from './config.js';

export class StatistigSystemButtons {
        
    public connections: number[] = [];
    public config: StatistigConfig | null = null;
    public batt = Main.panel.statusArea.quickSettings.menu.getFirstItem().get_child_at_index(0).get_child_at_index(0);
    public scrn = Main.panel.statusArea.quickSettings.menu.getFirstItem().get_child_at_index(0).get_child_at_index(2);
    public sttn = Main.panel.statusArea.quickSettings.menu.getFirstItem().get_child_at_index(0).get_child_at_index(3);
    public lock = Main.panel.statusArea.quickSettings.menu.getFirstItem().get_child_at_index(0).get_child_at_index(5);
    public proc: StatistigSystemButton | null = null;
    public mem: StatistigSystemButton | null = null;

    static create(config: StatistigConfig): StatistigSystemButtons {
        const ins = new this();
        ins.config = config;
        ins.bind();
        return ins;
    }

    public bind(): void {
        if (!this.config) { return }

        this.connections.push(
            this.config.connect('proc-btn-enabled', () => {
                this.toggleProc();
            }),
            this.config.connect('mem-btn-enabled', () => {
                this.toggleMem();
            }),
            this.config.connect('bat-btn-styled', () => {
                this.configureBatt();
            }),
            this.config.connect('scs-btn-hidden', () => {
                this.configureScrn();
            }),
            this.config.connect('stn-btn-hidden', () => {
                this.configureSttn();
            }),
            this.config.connect('lck-btn-hidden', () => {
                this.configureLock();
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
        
        this.configureBatt();
        this.configureScrn();
        this.configureSttn();
        this.configureLock();
        this.configureProc();
        this.toggleProc();
        this.configureMem();
        this.toggleMem();
    }

    public configureBatt(override: boolean = false): void {
        if (!this.config) { return }

        if (this.config.batteryButtonStyled && !override) {
            this.batt.set_style('font-family: monospace');
        } else {
            this.batt.set_style(null);
        }
    }

    public configureScrn(override: boolean = false): void {
        if (!this.config) { return }

        if (this.config.screenshotButtonHidden && !override) {
            this.scrn.hide();
        } else {
            this.scrn.show();
        }
    }

    public configureSttn(override: boolean = false): void {
        if (!this.config) { return }

        if (this.config.settingsButtonHidden && !override) {
            this.sttn.hide();
        } else {
            this.sttn.show();
        }
    }

    public configureLock(override: boolean = false): void {
        if (!this.config) { return }

        if (this.config.lockButtonHidden && !override) {
            this.lock.hide();
        } else {
            this.lock.show();
        }
    }

    public configureProc(): void {
        if (!this.config) { return }
        this.proc = StatistigSystemButton.create(this.config);
        Main.panel.statusArea.quickSettings.menu.getFirstItem().get_child_at_index(0).insert_child_at_index(this.proc, 1);
    }

    public toggleProc(): void {
        if (!this.config || !this.proc) { return }

        if (this.config.procButtonEnabled) {
            this.proc.show();
        } else {
            this.proc.hide();
        }
    }

    public configureMem(): void {
        if (!this.config) { return }
        this.mem = StatistigSystemButton.create(this.config);
        Main.panel.statusArea.quickSettings.menu.getFirstItem().get_child_at_index(0).insert_child_at_index(this.mem, 2);
    }

    public toggleMem(): void {
        if (!this.config || !this.mem) { return }

        if (this.config.memButtonEnabled) {
            this.mem.show();
        } else {
            this.mem.hide();
        }
    }
    
    public update(identifier: string, value: number) {
        if (!this.config) { return }
        
        if (identifier === 'proc' && this.proc && this.config.procButtonEnabled) {
            this.proc.update(identifier, value);
        }

        if (identifier === 'mem' && this.mem && this.config.memButtonEnabled) {
            this.mem.update(identifier, value);
        }
    }

    public destroy(): void {
        this.destroyMemButton();
        this.destroyProcButton();
        this.configureBatt(true);
        this.configureScrn(true);
        this.configureSttn(true);
        this.configureLock(true);
        this.unbind();

        if (this.config) {
            this.config = null;
        }
    }

    public destroyProcButton(): void {
        if (this.proc) {
            this.proc.destroy();
            this.proc = null;
        }
    }

    public destroyMemButton(): void {
        if (this.mem) {
            this.mem.destroy();
            this.mem = null;
        }
    }
}