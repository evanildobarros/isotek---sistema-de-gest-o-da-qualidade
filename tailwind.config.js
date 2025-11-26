/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                isotek: {
                    50: '#f5f7fb',
                    100: '#D5DCF2', // Lavanda claro
                    200: '#b6c4e8',
                    300: '#8FB2BF', // Azul-verde acinzentado
                    400: '#7790A6', // Azul-cinza médio
                    500: '#03A6A6', // Turquesa/Ciano (cor principal)
                    600: '#028a8a',
                    700: '#026e6e',
                    800: '#015252',
                    900: '#013636',
                    accent: '#03A6A6', // Turquesa
                    secondary: '#8FB2BF', // Azul suave
                    alert: '#F20505', // Vermelho para alertas
                    light: '#D5DCF2', // Lavanda
                    medium: '#7790A6', // Azul-cinza
                },
                // Custom Brand Colors - AdobeColor-Arquitetura Palette
                'brand-light': '#DCEEF2',  // Azul Gelo - Para fundos de seções claras
                'brand-cream': '#F2D5A0',  // Creme/Areia - Para destaques suaves
                'brand-salmon': '#D99873', // Salmão Suave - Para detalhes secundários
                'brand-terra': '#BF7960',  // Terracota - Para Botões de Ação/CTA
                'brand-brown': '#734636',  // Marrom Café - Para Textos Fortes, Rodapé e Títulos
            },
        },
    },
    plugins: [],
}
