#!/usr/bin/env node

import * as esbuild from 'esbuild-wasm';

esbuild.build({
    entryPoints: ['src/**/*.ts'],
    outdir: 'dist/',
    platform: 'neutral',
    format: 'esm'
});
