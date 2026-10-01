// ESLint configuration based on GNOME Shell's own rules (eslint-config-gnome,
// pinned to the commit GNOME Shell 51.0 uses). Formatting rules are left to
// Prettier; TypeScript-aware variants replace the core rules that misfire on
// type syntax.

import {defineConfig} from 'eslint/config';
import gnome from 'eslint-config-gnome';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default defineConfig([
    {
        ignores: ['dist/', 'node_modules/', 'guide/', 'tasks/', '_build_temp/'],
    },
    gnome.configs.recommended,
    {
        files: ['src/**/*.ts'],
        extends: [tseslint.configs.recommended],
        languageOptions: {
            parser: tseslint.parser,
        },
        rules: {
            // Type checking already covers these.
            'no-undef': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    varsIgnorePattern: '(^unused|_$)',
                    argsIgnorePattern: '^(unused|_)',
                },
            ],
            'no-shadow': 'off',
            '@typescript-eslint/no-shadow': 'error',
            'no-useless-constructor': 'off',
            '@typescript-eslint/no-useless-constructor': 'error',
        },
    },
    {
        files: ['scripts/**/*.js', 'eslint.config.js', 'prettier.config.js'],
        languageOptions: {
            globals: {process: 'readonly'},
        },
    },
    prettier,
]);
