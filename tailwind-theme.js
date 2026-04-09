// tailwind-theme.js
tailwind.config = {
    theme: {
        extend: {
            colors: { 
                brand: { 
                    primary: '#15518D',   /* Deep Trust Blue */
                    secondary: '#34A1C8', /* Vibrant Cyan */
                    accent: {
                        DEFAULT: '#1A824A', /* Emerald Green */
                        active: '#136538'   /* Darker Green for Click */
                    },
                    dark: '#0f172a',      /* Dark Text */
                    light: '#E0F2FE'      /* Medyo Sky Blue Background */
                } 
            },
            fontFamily: { 
                sans: ['Inter', 'system-ui', 'sans-serif'], 
            },
            boxShadow: {
                'soft': '0 10px 40px -10px rgba(0,0,0,0.08)',
                'glow': '0 0 20px rgba(21, 81, 141, 0.2)' 
            }
        }
    }
}
