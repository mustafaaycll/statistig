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

import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import {readTextFile} from './file.js';

export class StatistigMonitor extends GObject.Object {
    static {
        GObject.registerClass(
            {
                GTypeName: 'StatistigMonitor',
                Properties: {
                    'cpu-usage': GObject.ParamSpec.int(
                        'cpu-usage',
                        'CPU Usage',
                        'CPU usage in %',
                        GObject.ParamFlags.READABLE,
                        0,
                        100,
                        0,
                    ),
                    'ram-usage': GObject.ParamSpec.int(
                        'ram-usage',
                        'RAM Usage',
                        'RAM usage in %',
                        GObject.ParamFlags.READABLE,
                        0,
                        100,
                        0,
                    ),
                },
            },
            this,
        );
    }

    private _cpu = 0;
    private _mem = 0;
    private _prevTotal = 0;
    private _prevIdle = 0;
    private _hasSample = false;
    private _errorLogged = false;
    private _intervalId = 0;
    private _cancellable: Gio.Cancellable | null = null;
    private _busy = false;

    get cpu_usage() {
        return this._cpu;
    }

    get ram_usage() {
        return this._mem;
    }

    public start(): void {
        if (this._intervalId !== 0) return;
        this._cancellable = new Gio.Cancellable();
        // Sample right away: memory is shown immediately and the CPU
        // baseline is taken, so the first CPU value follows after 1 s.
        void this._sample();
        this._intervalId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            1,
            () => {
                void this._sample();
                return GLib.SOURCE_CONTINUE;
            },
        );
    }

    public stop(): void {
        if (this._intervalId !== 0) {
            GLib.source_remove(this._intervalId);
            this._intervalId = 0;
        }
        // Drop any read still in flight so no results arrive after stopping.
        this._cancellable?.cancel();
        this._cancellable = null;
        this._hasSample = false;
    }

    private async _sample(): Promise<void> {
        const cancellable = this._cancellable;
        // Skip a tick rather than overlap reads if the previous one is slow.
        if (this._busy || !cancellable) return;
        this._busy = true;
        try {
            const [stat, meminfo] = await Promise.all([
                readTextFile('/proc/stat', cancellable),
                readTextFile('/proc/meminfo', cancellable),
            ]);
            if (cancellable.is_cancelled()) return;
            this._updateCpu(stat);
            this._updateMem(meminfo);
            this._errorLogged = false;
        } catch (e) {
            if (
                e instanceof GLib.Error &&
                e.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED)
            ) {
                return;
            }
            // Log once per failure streak instead of every second.
            if (!this._errorLogged) {
                this._errorLogged = true;
                console.error('[Statistig] Failed to read /proc:', e);
            }
        } finally {
            this._busy = false;
        }
    }

    private _updateCpu(stat: string): void {
        const cpuLine = stat.split('\n')[0];
        const match = cpuLine.match(
            /^cpu\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/,
        );
        if (!match) return;

        // user nice system idle iowait irq softirq steal
        const fields = match.slice(1).map(Number);
        const total = fields.reduce((sum, n) => sum + n, 0);
        // Same accounting as top: iowait counts as idle time.
        const idleAll = fields[3] + fields[4];
        const totalDiff = total - this._prevTotal;
        const idleDiff = idleAll - this._prevIdle;
        this._prevTotal = total;
        this._prevIdle = idleAll;

        // The first sample is only a baseline; its counters are totals since
        // boot, not the last second.
        if (this._hasSample) {
            const cpu =
                totalDiff <= 0
                    ? 0
                    : Math.round(((totalDiff - idleDiff) / totalDiff) * 100);
            this._cpu = Math.min(100, Math.max(0, cpu));
            this.notify('cpu-usage');
        }
        this._hasSample = true;
    }

    private _updateMem(meminfo: string): void {
        let total = 1,
            available = 0;
        for (const line of meminfo.split('\n')) {
            if (line.startsWith('MemTotal:')) {
                total = parseInt(line.match(/\d+/)?.[0] ?? '1');
            } else if (line.startsWith('MemAvailable:')) {
                available = parseInt(line.match(/\d+/)?.[0] ?? '0');
            }
        }
        this._mem = Math.round(((total - available) / total) * 100);
        this.notify('ram-usage');
    }
}
