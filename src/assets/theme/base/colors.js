import themeConfig from "themeConfig";

export default {
  background: {
    default: "#f8f9fa",
  },

  sidenav: {
    button: themeConfig.sidenav.button,
  },

  text: {
    main: themeConfig.fonts.secondary,
    focus: themeConfig.fonts.primary,
  },

  transparent: {
    main: "transparent",
  },

  white: {
    main: "#ffffff",
    focus: "#ffffff",
  },

  brand: {
    main: themeConfig.primary,
    focus: themeConfig.accent,
  },

  black: {
    light: "#141414",
    main: "#000000",
    focus: "#000000",
  },

  primary: {
    main: themeConfig.primary,
    focus: themeConfig.accent,
  },

  secondary: {
    main: themeConfig.neutros ? themeConfig.neutros.escuro : "#1f0b0b",
    focus: themeConfig.neutros ? themeConfig.neutros.medio : "#240e0e",
  },

  lightblue: {
    main: "#f0555a",
    focus: "#f0555a",
  },

  orange: {
    main: "#f6ad55",
    focus: "#f6ad55",
  },

  grey: {
    100: "#edf2f7",
    200: "#e2e8f0",
    300: "#cbd5e0",
    400: "#a0aec0",
    500: "#718096",
    600: "#4a5568",
    700: "#2d3748",
    800: "#1a202a",
    900: "#171923",
  },

  borderCol: {
    main: "#5c4a4a",
    red: "#e31a1a",
    navbar: "rgba(226, 232, 240, 0.3)",
  },

  info: {
    main: themeConfig.primary,
    focus: themeConfig.accent,
    charts: themeConfig.tonsInfo
      ? {
          100: themeConfig.tonsInfo[0],
          200: themeConfig.tonsInfo[1],
          300: themeConfig.tonsInfo[2],
          400: themeConfig.tonsInfo[3],
          500: themeConfig.tonsInfo[4],
          600: themeConfig.tonsInfo[5],
        }
      : {
          100: "#f0555a",
          200: "#c4161c",
          300: "#c4161c",
          400: "#8f1015",
          500: "#650b0f",
          600: "#3d0609",
        },
  },

  success: {
    main: "#01b574",
    focus: "#35d28a",
  },

  warning: {
    main: "#ffb547",
    focus: "#ffcd75",
  },

  error: {
    main: "#e31a1a",
    focus: "#ee5d50",
  },

  light: {
    main: "#e9ecef",
    focus: "#ebeff4",
  },

  dark: {
    main: themeConfig.neutros ? themeConfig.neutros.claro : "#3a2a2a",
    focus: themeConfig.neutros ? themeConfig.neutros.escuro : "#2a0b0b",
    body: "#070707",
  },

  gradients: {
    navbar: {
      deg: "123.64deg",
      main: "rgba(255, 255, 255, 0) -22.38%",
      state: "rgba(255, 255, 255, 0.039) 70.38%",
    },

    sidenav: {
      deg: "127.09",
      main: themeConfig.sidenav.main,
      state: themeConfig.sidenav.state,
    },

    borderLight: {
      angle: "94.43% 69.43% at 50% 50%",
      main: "#ffffff 0%",
      state: "rgba(255, 255, 255, 0) 100%",
    },

    borderDark: {
      angle: "69.43% 69.43% at 50% 50%",
      main: "#ffffff 0%",
      state: "rgba(255, 255, 255, 0) 100%",
    },

    cover: {
      deg: "159.02",
      main: "#240808 14.25%",
      state: "#170505 56.45%",
      stateSecondary: "#090202 86.14%",
    },

    cardDark: {
      deg: "126.97",
      main: "rgba(40, 6, 6, 0.74) 28.26%",
      state: "rgba(28, 5, 5, 0.71) 91.2%",
    },

    cardLight: {
      deg: "127.09",
      main: "rgba(40, 6, 6, 0.94) 19.41%",
      state: "rgba(28, 5, 5, 0.49) 76.65%",
    },

    card: {
      deg: "127.09",
      main: "rgba(40, 6, 6, 0.94) 19.41%",
      state: "rgba(28, 5, 5, 0.49) 76.65%",
    },

    menu: {
      deg: "126.97",
      main: "#2a0b0b 28.26%",
      state: "#3d1010 91.2%",
    },

    cardContent: {
      deg: "126.97",
      main: "rgb(40, 6, 6) 28.26%",
      state: "rgb(28, 5, 5) 91.2%",
    },

    box: {
      deg: "126.97",
      main: "rgba(40, 6, 6, 0.74) 28.26%",
      state: "rgba(28, 5, 5, 0.71) 91.2%",
    },

    bill: {
      deg: "127.09",
      main: "rgba(60, 18, 18, 0.94) 19.41%",
      state: "rgba(28, 5, 5, 0.49) 76.65%",
    },

    primary: {
      deg: "97.89",
      main: themeConfig.primary,
      state: themeConfig.personalizado ? themeConfig.accent : "#ff6a4d",
    },

    secondary: {
      main: "#8a7777",
      state: "#c9b8b8",
    },

    logo: {
      deg: "97.89",
      main: "#ffffff 70.67%",
      state: "rgba(117, 122, 140, 0) 108.55%",
    },

    info: {
      main: themeConfig.primary,
      state: themeConfig.personalizado ? themeConfig.accent : "#ff6a4d",
    },

    success: {
      main: "#01B574",
      state: "#c9fbd5",
    },

    warning: {
      main: "#f53939",
      state: "#fbcf33",
    },

    error: {
      main: "#f53c2b",
      state: "#f53c2b",
    },

    light: {
      main: "#ced4da",
      state: "#ebeff4",
    },

    dark: {
      main: themeConfig.neutros ? themeConfig.neutros.escuro : "#1a1010",
      state: themeConfig.neutros ? themeConfig.neutros.claro : "#5a4545",
    },
  },

  alertColors: {
    primary: {
      main: "#7928ca",
      state: "#d6006c",
      border: "#efb6e2",
    },

    secondary: {
      main: "#8a7777",
      state: "#b8a5a5",
      border: "#e6dada",
    },

    info: {
      main: themeConfig.primary,
      state: themeConfig.personalizado ? themeConfig.accent : "#ff6a4d",
      border: "#f9b4b4",
    },

    success: {
      main: "#17ad37",
      state: "#84dc14",
      border: "#daf3b9",
    },

    warning: {
      main: "#f53939",
      state: "#fac60b",
      border: "#fef1c2",
    },

    error: {
      main: "#ea0606",
      state: "#ff3d59",
      border: "#f9b4b4",
    },

    light: {
      main: "#ced4da",
      state: "#d1dae6",
      border: "#f8f9fa",
    },

    dark: {
      main: "#1a1010",
      state: "#3a2424",
      border: "#c8c0c0",
    },
  },

  badgeColors: {
    primary: {
      basic: "#805ad5",
      background: "#f883dd",
      text: "#a3017e",
    },

    secondary: {
      basic: "#8a7777",
      background: "#ede6e6",
      text: "#8a7777",
    },

    info: {
      basic: themeConfig.primary,
      background: "#fc9797",
      text: "#bd0000",
    },

    success: {
      basic: "#01b574",
      background: "#c9fbd5",
      text: "#01b574",
    },

    warning: {
      basic: "#ffb547",
      background: "#fef5d3",
      text: "#fbc400",
    },

    error: {
      basic: "#e31a1a",
      background: "#fc9797",
      text: "#bd0000",
    },

    light: {
      basic: "#ffffff",
      background: "#ffffff",
      text: "#c7d3de",
    },

    dark: {
      basic: "#2a1010",
      background: "#2a1010",
      text: "#fff",
    },
  },

  inputColors: {
    backgroundColor: themeConfig.inputs.backgroundColor,
    borderColor: {
      main: themeConfig.inputs.borderColor,
      focus: themeConfig.inputs.focusBorderColor,
    },
    boxShadow: themeConfig.inputs.focusBoxShadow,
    color: themeConfig.inputs.color,
    placeholderColor: themeConfig.inputs.placeholderColor,
    error: "#fd5c70",
    success: "#66d432",
  },

  sliderColors: {
    thumb: { borderColor: "#d9d9d9" },
  },

  circleSliderColors: {
    background: "#d3d3d3",
  },

  tabs: {
    indicator: { boxShadow: "#ddd" },
  },
};
