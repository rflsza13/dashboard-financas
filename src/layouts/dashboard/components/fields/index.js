import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";

import VuiTypography from "components/VuiTypography";
import themeConfig from "themeConfig";

export const NativeSelect = styled("select")({
  width: "100%",
  height: "40px",
  padding: "0 12px",
  borderRadius: "15px",
  border: `1px solid ${themeConfig.cards.borderColor}`,
  background: "transparent",
  color: themeConfig.fonts.primary,
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
  cursor: "pointer",
  "&:focus": { borderColor: themeConfig.primary },
  "& option": { background: "#1a0808", color: themeConfig.fonts.primary },
});

export function FieldLabel({ children }) {
  return (
    <VuiTypography
      component="label"
      variant="caption"
      color="text"
      fontWeight="medium"
      sx={{ display: "block", mb: "6px" }}
    >
      {children}
    </VuiTypography>
  );
}

FieldLabel.propTypes = {
  children: PropTypes.node.isRequired,
};
