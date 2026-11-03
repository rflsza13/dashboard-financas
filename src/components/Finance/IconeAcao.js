import PropTypes from "prop-types";
import themeConfig from "themeConfig";

function IconeAcao({ titulo, onClick, children, cor }) {
  return (
    <span
      role="button"
      tabIndex={0}
      title={titulo}
      aria-label={titulo}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      style={{
        cursor: "pointer",
        color: cor || themeConfig.fonts.secondary,
        marginLeft: 10,
        display: "inline-flex",
        verticalAlign: "middle",
      }}
    >
      {children}
    </span>
  );
}

IconeAcao.propTypes = {
  titulo: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  cor: PropTypes.string,
};

IconeAcao.defaultProps = {
  cor: "",
};

export default IconeAcao;
