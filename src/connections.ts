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

export class StatistigConnections {
    toggle: number | null;
    monitor: {
        proc: number | null,
        mem: number | null
    };
    switch: {
        proc: number | null,
        mem: number | null
    }

    constructor() {
        this.toggle = null;
        this.monitor = {
            proc: null,
            mem: null
        }
        this.switch = {
            proc: null,
            mem: null
        }
    }
}