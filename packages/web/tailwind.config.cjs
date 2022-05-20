const defaultTheme = require('tailwindcss/defaultTheme');
const typography = require('@tailwindcss/typography');
const forms = require('@tailwindcss/forms');

const config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			fontFamily: {
				sans: ['Chivo', ...defaultTheme.fontFamily.sans]
			}
		}
	},

	plugins: [forms, typography]
};

module.exports = config;
