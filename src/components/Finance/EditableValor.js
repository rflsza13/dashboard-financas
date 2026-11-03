import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

import { brl } from "utils/finance";
import themeConfig from "themeConfig";

export function parseValor(texto) {
  let s = String(texto).replace(/R\$/gi, "").replace(/\s/g, "");
  if (s === "") return 0;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

/** Valor em reais que vira um campo ao clicar. Enter/saída salva, Esc cancela. */
function EditableValor({ valor, onSalvar, disabled, cor, vazio, largura }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    if (editando && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, [editando]);

  const abrir = () => {
    if (disabled) return;
    setTexto(valor ? String(valor).replace(".", ",") : "");
    setEditando(true);
  };

  const confirmar = () => {
    setEditando(false);
    const novo = parseValor(texto);
    if (novo === null || novo === valor) return;
    onSalvar(novo);
  };

  if (editando) {
    return (
      <input
        ref={ref}
        value={texto}
        inputMode="decimal"
        aria-label="Valor"
        onChange={(e) => setTexto(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === "Enter") confirmar();
          if (e.key === "Escape") setEditando(false);
        }}
        style={{
          width: largura,
          textAlign: "right",
          background: "rgba(53, 15, 15, 0.6)",
          color: themeConfig.fonts.primary,
          border: `1px solid ${themeConfig.primary}`,
          borderRadius: 8,
          padding: "4px 6px",
          font: "inherit",
          fontSize: 13,
          outline: "none",
        }}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={abrir}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && abrir()}
      style={{
        display: "inline-block",
        minWidth: largura,
        textAlign: "right",
        padding: "4px 6px",
        borderRadius: 8,
        cursor: disabled ? "default" : "pointer",
        color: valor ? cor || themeConfig.fonts.primary : themeConfig.fonts.secondary,
        fontSize: 13,
      }}
    >
      {valor ? brl(valor) : vazio}
    </span>
  );
}

EditableValor.propTypes = {
  valor: PropTypes.number,
  onSalvar: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  cor: PropTypes.string,
  vazio: PropTypes.string,
  largura: PropTypes.number,
};

EditableValor.defaultProps = {
  valor: 0,
  disabled: false,
  cor: "",
  vazio: "—",
  largura: 92,
};

export default EditableValor;
