/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                'bg-secondary': 'var(--bg-secondary)',
                'bg-tertiary': 'var(--bg-tertiary)',
                neon: {
                    blue: 'var(--neon-blue)',
                    purple: 'var(--neon-purple)',
                    green: 'var(--neon-green)',
                    red: 'var(--neon-red)',
                },
            },
            fontFamily: {
                heading: ['var(--font-orbitron)', 'sans-serif'],
                body: ['var(--font-inter)', 'sans-serif'],
            },
            backgroundImage: {
                'glass': 'var(--glass-bg)',
            },
            boxShadow: {
                'glow-blue': 'var(--glow-blue)',
                'glow-purple': 'var(--glow-purple)',
                'glow-green': 'var(--glow-green)',
            },
            animation: {
                'glow': 'glow-pulse 3s infinite',
            }
        },
    },
    plugins: [],
};
