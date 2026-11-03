const themeConfig = {
  primary: "#e3242b",
  accent: "#ff5a4f",
  background: {
    customImageUrl: "",
    useDefaultImage: false,
    gradient:
      "radial-gradient(900px 500px at 88% -8%, rgba(227, 36, 43, 0.20), transparent 60%), radial-gradient(700px 400px at -5% 105%, rgba(227, 36, 43, 0.08), transparent 60%), #070707",
  },
  cards: {
    background: "rgba(40, 6, 6, 0.74)",
    backdropFilter: "blur(120px)",
    borderColor: "rgba(255, 255, 255, 0.125)",
  },
  fonts: { primary: "#ffffff", secondary: "#a0aec0" },
  checkbox: { borderColor: "rgba(255, 255, 255, 0.65)", checkedBackground: "#01b574", checkColor: "#ffffff" },
  login: {
    imageUrl: "",
    imageOverlay: "linear-gradient(135deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.55))",
    fallbackBackground:
      "radial-gradient(700px 500px at 20% 20%, rgba(227, 36, 43, 0.55), transparent 65%), radial-gradient(600px 500px at 80% 90%, rgba(255, 90, 79, 0.25), transparent 60%), #0b0b0b",
    title: "Bem-vindo(a)!",
    message: "Acesse o painel com a conta Google cadastrada.",
    panelBlur: "blur(18px)",
  },
  scrollbar: { width: 6, color: "", hoverColor: "" },
  inputs: {
    backgroundColor: "rgba(53, 15, 15, 0.6)",
    color: "#ffffff",
    placeholderColor: "#a0aec0",
    borderColor: "rgba(226, 232, 240, 0.3)",
    focusBorderColor: "#e3242b",
    focusBoxShadow: "rgba(227, 36, 43, 0.35)",
  },
};

export default themeConfig;
