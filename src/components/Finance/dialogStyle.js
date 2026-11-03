import themeConfig from "themeConfig";

export const dialogPaper = {
  sx: {
    background: themeConfig.cards.background,
    backdropFilter: themeConfig.cards.backdropFilter,
    WebkitBackdropFilter: themeConfig.cards.backdropFilter,
    backgroundImage: "none",
    border: `1px solid ${themeConfig.cards.borderColor}`,
    borderRadius: "20px",
  },
};

export const MSG_ERRO = {
  display: "block",
  mt: "4px",
};
