#!/usr/bin/env node

import * as esbuild from 'esbuild-wasm';

try {
    await esbuild.build({
        entryPoints: ['src/**/*.ts'],
        outdir: 'dist/',
        platform: 'neutral',
        format: 'esm',
        target: 'es2022',
        logLevel: 'info',
        // esbuild drops source comments, so restore the license notice in
        // every shipped file.
        banner: {
            js: [
                '// Copyright (C) 2025 Mustafa Yücel <mustafayucel.cs@gmail.com>',
                '// This file is part of Statistig, distributed under the GNU General',
                '// Public License, version 3 or later. Source code and full license:',
                '// https://github.com/mustafaaycll/statistig',
            ].join('\n'),
        },
    });
} catch {
    // esbuild has already printed the errors (logLevel: 'info').
    process.exit(1);
}
