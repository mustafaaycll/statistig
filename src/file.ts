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

import Gio from 'gi://Gio';

const decoder = new TextDecoder('utf-8');

/**
 * Reads a small text file (e.g. under /proc) without blocking the shell.
 * Rejects on failure, including cancellation.
 */
export function readTextFile(
    path: string,
    cancellable: Gio.Cancellable | null = null,
): Promise<string> {
    const file = Gio.File.new_for_path(path);
    return new Promise((resolve, reject) => {
        file.load_contents_async(cancellable, (_source, result) => {
            try {
                const [, contents] = file.load_contents_finish(result);
                resolve(decoder.decode(contents));
            } catch (e) {
                reject(e);
            }
        });
    });
}
