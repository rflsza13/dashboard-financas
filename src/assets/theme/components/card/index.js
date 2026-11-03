import themeConfig from "themeConfig";
import borders from "assets/theme/base/borders";
import boxShadows from "assets/theme/base/boxShadows";

const { borderRadius } = borders;
const { xxl } = boxShadows;

export default {
  styleOverrides: {
    root: {
      display: "flex",
      flexDirection: "column",
      background: themeConfig.cards.background,
      backdropFilter: themeConfig.cards.backdropFilter,
      WebkitBackdropFilter: themeConfig.cards.backdropFilter,
      position: "relative",
      minWidth: 0,
      padding: "22px",
      wordWrap: "break-word",
      backgroundClip: "border-box",
      border: `1px solid ${themeConfig.cards.borderColor}`,
      borderRadius: borderRadius.xl,
      boxShadow: xxl,
    },
  },
};
