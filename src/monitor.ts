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
import { File } from './file.js';

export const StatistigMonitor = GObject.registerClass(
  {
    GTypeName: 'StatistigMonitor',
    Properties: {
      'cpu-usage': GObject.ParamSpec.int('cpu-usage', 'CPU Usage', 'CPU usage in %', GObject.ParamFlags.READABLE, 0, 100, 0),
      'ram-usage': GObject.ParamSpec.int('ram-usage', 'RAM Usage', 'RAM usage in %', GObject.ParamFlags.READABLE, 0, 100, 0),
    },
  },
  class StatistigMonitor extends GObject.Object {
    private _cpu = 0;
    private _mem = 0;
    private _prevUsed = 0;
    private _prevIdle = 0;
    private _intervalId = 0;

    get cpu_usage() {
      return this._cpu;
    }

    get ram_usage() {
      return this._mem;
    }

    public start(): void {
      if (this._intervalId !== 0) return;
      this._intervalId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
        this._update();
        return GLib.SOURCE_CONTINUE;
      });
    }

    public stop(): void {
      if (this._intervalId !== 0) {
        GLib.source_remove(this._intervalId);
        this._intervalId = 0;
      }
    }

    private async _update(): Promise<void> {
      try {
        const stat = await new File('/proc/stat').read();
        const cpuLine = stat.split('\n')[0];
        const match = cpuLine.match(/^cpu\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
        if (match) {
          const [_, user, nice, system, idle] = match.map(Number);
          const used = user + nice + system;
          const usedDiff = used - this._prevUsed;
          const idleDiff = idle - this._prevIdle;
          this._prevUsed = used;
          this._prevIdle = idle;
          const total = usedDiff + idleDiff;
          const cpu = total === 0 ? 0 : Math.round((usedDiff / total) * 100);
          
          this._cpu = cpu;
          this.notify('cpu-usage');
        }

        const meminfo = await new File('/proc/meminfo').read();
        let total = 1, available = 0;
        for (const line of meminfo.split('\n')) {
          if (line.startsWith('MemTotal:')) {
            total = parseInt(line.match(/\d+/)?.[0] ?? '1');
          } else if (line.startsWith('MemAvailable:')) {
            available = parseInt(line.match(/\d+/)?.[0] ?? '0');
          }
        }
        const mem = Math.round(((total - available) / total) * 100);
        
        this._mem = mem;
        this.notify('ram-usage');
      } catch (e) {
        logError(e);
      }
    }

    override vfunc_dispose(): void {
      this.stop();
      super.vfunc_dispose();
    }
    
  }
);

export type StatistigMonitor = InstanceType<typeof StatistigMonitor>;
