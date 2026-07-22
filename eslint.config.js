import globals from 'globals';
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        ignores: ["*.config.js"]
    },

    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node
            }
        },
        rules: {
            "no-undef": "error",
            "no-unused-vars": "warn",
            "no-console": "off",
            "semi": ["warn", "always"]
        }
    }
]);