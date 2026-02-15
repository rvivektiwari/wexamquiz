/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./index.html", "./js/**/*.js"],
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                sans: ['Manrope', 'Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
                display: ['Inter', 'sans-serif'],
            },
            colors: {
                gray: {
                    50: '#F9FAFB',
                    100: '#F3F4F6',
                    200: '#E5E7EB',
                    300: '#D1D5DB',
                    400: '#9CA3AF',
                    500: '#6B7280',
                    600: '#4B5563',
                    700: '#374151',
                    800: '#1F2937',
                    900: '#111827',
                    950: '#030712',
                },
                brand: {
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8', // Main Brand Color
                    800: '#1e40af',
                    900: '#1e3a8a',
                    950: '#172554',
                }
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
            },
            animation: {
                'bounce-slow': 'bounce 3s infinite',
            }
        },
    },
    plugins: [],
}
