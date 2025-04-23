/** @type {import("prettier").Config} */
export default {
    tabWidth: 4,
    singleQuote: true,
    bracketSpacing: false,
    overrides: [
        {
            files: ['*.json', '*.yml', '*.yaml'],
            options: {
                tabWidth: 2,
            },
        },
    ],
};
