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
    });
} catch {
    // esbuild has already printed the errors (logLevel: 'info').
    process.exit(1);
}
