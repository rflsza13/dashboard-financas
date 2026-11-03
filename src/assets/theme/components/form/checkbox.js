import themeConfig from "themeConfig";
import borders from "assets/theme/base/borders";
import colors from "assets/theme/base/colors";
import pxToRem from "assets/theme/functions/pxToRem";

const { borderWidth } = borders;
const { transparent, info } = colors;
const { borderColor, checkedBackground, checkColor } = themeConfig.checkbox;

const checkIcon = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 -1 22 22'><path fill='none' stroke='${checkColor}' stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M6 10l3 3l6-6'/></svg>`
)}")`;

const checked = {
  "&.Mui-checked": {
    backgroundImage: checkIcon,
    backgroundColor: checkedBackground,
    borderColor: checkedBackground,
  },
  "&:hover": {
    backgroundColor: transparent.main,
  },
  "&.Mui-checked:hover": {
    backgroundColor: checkedBackground,
  },
};

export default {
  styleOverrides: {
    root: {
      backgroundPosition: "center",
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      width: pxToRem(20),
      height: pxToRem(20),
      marginRight: pxToRem(6),
      padding: 0,
      color: transparent.main,
      border: `${borderWidth[1]} solid ${borderColor}`,
      borderRadius: pxToRem(5.6),
      transition: "all 250ms ease",

      "& .MuiSvgIcon-root": {
        fill: transparent.main,
      },

      "&.Mui-focusVisible": {
        border: `${borderWidth[2]} solid ${info.main} !important`,
      },
    },

    colorPrimary: {
      backgroundColor: transparent.main,
      ...checked,
    },

    colorSecondary: {
      backgroundColor: transparent.main,
      ...checked,
    },
  },
};
