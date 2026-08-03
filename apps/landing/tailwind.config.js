import forms from "@tailwindcss/forms";
import containerQueries from "@tailwindcss/container-queries";

export default {
  content: ["./index.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "inverse-on-surface": "#313030",
        surface: "#131313",
        "on-secondary-fixed-variant": "#454747",
        "on-background": "#e5e2e1",
        "on-tertiary-fixed-variant": "#00497b",
        "inverse-primary": "#a04100",
        background: "#131313",
        "on-error-container": "#ffdad6",
        "on-primary": "#561f00",
        "error-container": "#93000a",
        "primary-container": "#ff6b00",
        "outline-variant": "#5a4136",
        "on-error": "#690005",
        "tertiary-fixed": "#d0e4ff",
        "on-surface-variant": "#e2bfb0",
        "surface-container": "#201f1f",
        "surface-container-low": "#1c1b1b",
        "on-surface": "#e5e2e1",
        "surface-container-high": "#2a2a2a",
        "on-secondary-fixed": "#1a1c1c",
        tertiary: "#9ccaff",
        "on-primary-fixed-variant": "#7a3000",
        "tertiary-fixed-dim": "#9ccaff",
        secondary: "#c6c6c7",
        "on-secondary": "#2f3131",
        error: "#ffb4ab",
        "surface-variant": "#353534",
        "on-tertiary": "#003257",
        "on-tertiary-fixed": "#001d35",
        "surface-tint": "#ffb693",
        "surface-container-lowest": "#0e0e0e",
        "on-tertiary-container": "#003357",
        "secondary-container": "#454747",
        outline: "#a98a7d",
        "surface-container-highest": "#353534",
        "on-primary-fixed": "#351000",
        "primary-fixed": "#ffdbcc",
        "secondary-fixed": "#e2e2e2",
        primary: "#ffb693",
        "on-primary-container": "#572000",
        "tertiary-container": "#059eff",
        "primary-fixed-dim": "#ffb693",
        "surface-bright": "#3a3939",
        "on-secondary-container": "#b4b5b5",
        "surface-dim": "#131313",
        "secondary-fixed-dim": "#c6c6c7",
        "inverse-surface": "#e5e2e1"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        xl: "64px",
        lg: "40px",
        sm: "16px",
        gutter: "20px",
        "container-max": "1200px",
        md: "24px",
        xs: "8px",
        base: "4px"
      },
      fontFamily: {
        "headline-lg": ["Space Grotesk"],
        "body-md": ["Inter"],
        "title-md": ["Space Grotesk"],
        "display-lg": ["Space Grotesk"],
        "headline-lg-mobile": ["Space Grotesk"],
        "label-sm": ["Inter"],
        "body-lg": ["Inter"]
      },
      fontSize: {
        "headline-lg": ["32px", { lineHeight: "40px", fontWeight: "700" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "title-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg-mobile": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "label-sm": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }]
      }
    }
  },
  plugins: [forms, containerQueries]
};
