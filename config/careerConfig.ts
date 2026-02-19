
export interface CareerConfig {
    name: string;
    colors: {
        primary: string;
        secondary: string;
        text?: string;
    };
    icon: string;
    logo?: string; // Path to the logo image
}

// Default Configuration (Software Engineering)
// You can switch this object to change the career context
// Career Configurations Map
export const CAREERS: Record<string, CareerConfig> = {
    isw: {
        name: "Ingeniería en Software",
        colors: {
            primary: "#6366f1", // Indigo-500
            secondary: "#818cf8", // Indigo-400
        },
        icon: "code",
        logo: "assets/isw/logo.png"
    },
    ltf: {
        name: "Licenciatura en Terapia Física",
        colors: {
            primary: "#0ea5e9", // Sky-500
            secondary: "#38bdf8", // Sky-400
        },
        icon: "activity",
        logo: "assets/ltf/logo.png"
    },
    iaev: {
        name: "Ing. Animación y Efectos Visuales",
        colors: {
            primary: "#8b5cf6", // Violet-500
            secondary: "#a78bfa", // Violet-400
        },
        icon: "film",
        logo: "assets/iaev/logo.png"
    },
    imi: {
        name: "Ing. Metrología Industrial",
        colors: {
            primary: "#10b981", // Emerald-500
            secondary: "#34d399", // Emerald-400
        },
        icon: "ruler",
        logo: "assets/imi/logo.png"
    },
    isa: {
        name: "Ing. Sistemas Automotrices",
        colors: {
            primary: "#ef4444", // Red-500
            secondary: "#f87171", // Red-400
        },
        icon: "settings",
        logo: "assets/isa/logo.png"
    },
    irc: {
        name: "Ing. Robótica Computacional",
        colors: {
            primary: "#f59e0b", // Amber-500
            secondary: "#fbbf24", // Amber-400
        },
        icon: "cpu",
        logo: "assets/irc/logo.png"
    },
    idiomas: {
        name: "Coordinación de Idiomas",
        colors: {
            primary: "#ec4899", // Pink-500
            secondary: "#f472b6", // Pink-400
        },
        icon: "globe",
        logo: "assets/idiomas/logo.png"
    },
    stem: {
        name: "Coordinación STEM",
        colors: {
            primary: "#14b8a6", // Teal-500
            secondary: "#2dd4bf", // Teal-400
        },
        icon: "flask-conical",
        logo: "assets/stem/logo.png"
    }
};

// Default fallback
export const CAREER_CONFIG = CAREERS['isw'];

