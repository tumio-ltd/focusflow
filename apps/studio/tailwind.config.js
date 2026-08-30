import sharedConfig from '@focusflow/config-tailwind';

/** @type {import('tailwindcss').Config} */
export default {
  ...sharedConfig,
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
};
