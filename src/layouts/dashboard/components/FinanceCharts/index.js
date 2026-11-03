import { useMemo } from "react";
import PropTypes from "prop-types";
import Chart from "react-apexcharts";

import { MESES, brl, brlCompact } from "utils/finance";
import themeConfig from "themeConfig";

const texto = { colors: themeConfig.fonts.secondary, fontSize: "11px" };
const COR_INVEST = "#f6ad55";
const PALETA = ["#e3242b", "#ff6a4d", "#f6ad55", "#01b574", "#8f9bff", "#c084fc", "#38bdf8", "#facc15", "#94a3b8"];

const base = {
  chart: { toolbar: { show: false }, background: "transparent", fontFamily: "inherit" },
  grid: { strokeDashArray: 5, borderColor: themeConfig.cards.borderColor },
  dataLabels: { enabled: false },
};

const fmt = (v) => (v === null || v === undefined ? "—" : brl(v));

export function FluxoMensalChart({ calc, cores }) {
  const series = useMemo(
    () => [
      { name: "Receitas", type: "column", data: calc.blocos.Receita.real },
      { name: "Despesas", type: "column", data: calc.blocos.Despesa.real },
      { name: "Investimentos", type: "column", data: calc.blocos.Investimento.real },
      { name: "Saldo acumulado", type: "line", data: calc.acumReal },
    ],
    [calc]
  );

  const options = useMemo(
    () => ({
      ...base,
      colors: [cores.receitas, cores.despesas, COR_INVEST, cores.saldo],
      stroke: { width: [0, 0, 0, 3], curve: "smooth" },
      plotOptions: { bar: { columnWidth: "55%", borderRadius: 4 } },
      markers: { size: [0, 0, 0, 4] },
      xaxis: { categories: MESES, labels: { style: texto }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: texto, formatter: (v) => brlCompact(v) } },
      legend: { position: "top", horizontalAlign: "right", labels: { colors: themeConfig.fonts.primary } },
      tooltip: { theme: "dark", shared: true, intersect: false, y: { formatter: fmt } },
    }),
    [cores]
  );

  return <Chart options={options} series={series} type="line" width="100%" height="100%" />;
}

FluxoMensalChart.propTypes = {
  calc: PropTypes.object.isRequired,
  cores: PropTypes.shape({
    receitas: PropTypes.string.isRequired,
    despesas: PropTypes.string.isRequired,
    saldo: PropTypes.string.isRequired,
  }).isRequired,
};

export function RealEstimadoChart({ calc, cores }) {
  const series = useMemo(
    () => [
      { name: "Receitas (real)", data: calc.blocos.Receita.real.map((v, i) => (i <= calc.ultimoMes ? v : null)) },
      { name: "Receitas (estimado)", data: calc.blocos.Receita.est },
      { name: "Despesas (real)", data: calc.blocos.Despesa.real.map((v, i) => (i <= calc.ultimoMes ? v : null)) },
      { name: "Despesas (estimado)", data: calc.blocos.Despesa.est },
    ],
    [calc]
  );

  const options = useMemo(
    () => ({
      ...base,
      colors: [cores.receitas, cores.receitas, cores.despesas, cores.despesas],
      stroke: { width: [3, 2, 3, 2], curve: "smooth", dashArray: [0, 6, 0, 6] },
      markers: { size: [4, 0, 4, 0] },
      xaxis: { categories: MESES, labels: { style: texto }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: texto, formatter: (v) => brlCompact(v) } },
      legend: { position: "top", horizontalAlign: "right", labels: { colors: themeConfig.fonts.primary } },
      tooltip: { theme: "dark", shared: true, intersect: false, y: { formatter: fmt } },
    }),
    [cores]
  );

  return <Chart options={options} series={series} type="line" width="100%" height="100%" />;
}

RealEstimadoChart.propTypes = {
  calc: PropTypes.object.isRequired,
  cores: PropTypes.shape({
    receitas: PropTypes.string.isRequired,
    despesas: PropTypes.string.isRequired,
  }).isRequired,
};

/** Barras horizontais de um valor por rótulo (ex.: despesas por categoria no ano). */
export function CategoriasChart({ categorias, limite, cor }) {
  const top = useMemo(() => categorias.slice(0, limite), [categorias, limite]);
  const series = useMemo(() => [{ name: "Total", data: top.map((c) => c.total) }], [top]);

  const options = useMemo(
    () => ({
      ...base,
      colors: [cor],
      plotOptions: { bar: { horizontal: true, borderRadius: 6, barHeight: "60%" } },
      dataLabels: {
        enabled: true,
        formatter: (v) => brlCompact(v),
        style: { fontSize: "11px", colors: [themeConfig.fonts.primary] },
        dropShadow: { enabled: false },
      },
      xaxis: {
        categories: top.map((c) => c.nome),
        labels: { style: texto, formatter: (v) => brlCompact(Number(v)) },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { colors: themeConfig.fonts.primary, fontSize: "12px" } } },
      legend: { show: false },
      tooltip: { theme: "dark", y: { formatter: fmt } },
    }),
    [top, cor]
  );

  return <Chart options={options} series={series} type="bar" width="100%" height="100%" />;
}

CategoriasChart.propTypes = {
  categorias: PropTypes.array.isRequired,
  limite: PropTypes.number,
  cor: PropTypes.string,
};

CategoriasChart.defaultProps = {
  limite: 8,
  cor: themeConfig.primary,
};

/** Rosca com a participação de cada categoria. */
export function RoscaChart({ dados }) {
  const series = useMemo(() => dados.map((d) => d.valor), [dados]);
  const options = useMemo(
    () => ({
      chart: { background: "transparent", fontFamily: "inherit" },
      labels: dados.map((d) => d.nome),
      colors: PALETA,
      stroke: { width: 0 },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            size: "68%",
            labels: {
              show: true,
              name: { color: themeConfig.fonts.secondary },
              value: { color: themeConfig.fonts.primary, formatter: (v) => brl(Number(v)) },
              total: {
                show: true,
                label: "Total",
                color: themeConfig.fonts.secondary,
                formatter: (w) => brl(w.globals.seriesTotals.reduce((a, b) => a + b, 0)),
              },
            },
          },
        },
      },
      legend: { position: "bottom", labels: { colors: themeConfig.fonts.primary } },
      tooltip: { theme: "dark", y: { formatter: fmt } },
    }),
    [dados]
  );

  return <Chart options={options} series={series} type="donut" width="100%" height="100%" />;
}

RoscaChart.propTypes = {
  dados: PropTypes.arrayOf(
    PropTypes.shape({ nome: PropTypes.string.isRequired, valor: PropTypes.number.isRequired })
  ).isRequired,
};

/** Barras agrupadas estimado × realizado (por bloco ou por categoria). */
export function ComparativoChart({ rotulos, estimado, real, horizontal, legendas }) {
  const series = useMemo(
    () => [
      { name: legendas[0], data: estimado },
      { name: legendas[1], data: real },
    ],
    [estimado, real, legendas]
  );
  const options = useMemo(
    () => ({
      ...base,
      colors: ["#8f9bff", themeConfig.primary],
      plotOptions: { bar: { horizontal, columnWidth: "55%", barHeight: "70%", borderRadius: 4 } },
      xaxis: {
        categories: rotulos,
        labels: { style: horizontal ? texto : { colors: themeConfig.fonts.primary, fontSize: "12px" }, formatter: horizontal ? (v) => brlCompact(Number(v)) : undefined },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: horizontal
        ? { labels: { style: { colors: themeConfig.fonts.primary, fontSize: "12px" } } }
        : { labels: { style: texto, formatter: (v) => brlCompact(v) } },
      legend: { position: "top", horizontalAlign: "right", labels: { colors: themeConfig.fonts.primary } },
      tooltip: { theme: "dark", shared: true, intersect: false, y: { formatter: fmt } },
    }),
    [rotulos, horizontal]
  );
  return <Chart options={options} series={series} type="bar" width="100%" height="100%" />;
}

ComparativoChart.propTypes = {
  rotulos: PropTypes.arrayOf(PropTypes.string).isRequired,
  estimado: PropTypes.arrayOf(PropTypes.number).isRequired,
  real: PropTypes.arrayOf(PropTypes.number).isRequired,
  horizontal: PropTypes.bool,
  legendas: PropTypes.arrayOf(PropTypes.string),
};

ComparativoChart.defaultProps = {
  horizontal: false,
  legendas: ["Estimado", "Realizado"],
};

/** Colunas simples de um valor por rótulo. */
export function BarrasChart({ rotulos, valores, nome, cor }) {
  const series = useMemo(() => [{ name: nome, data: valores }], [nome, valores]);
  const options = useMemo(
    () => ({
      ...base,
      colors: [cor],
      plotOptions: { bar: { columnWidth: "55%", borderRadius: 4 } },
      xaxis: { categories: rotulos, labels: { style: texto }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: texto, formatter: (v) => brlCompact(v) } },
      legend: { show: false },
      tooltip: { theme: "dark", y: { formatter: fmt } },
    }),
    [rotulos, cor]
  );
  return <Chart options={options} series={series} type="bar" width="100%" height="100%" />;
}

BarrasChart.propTypes = {
  rotulos: PropTypes.arrayOf(PropTypes.string).isRequired,
  valores: PropTypes.arrayOf(PropTypes.number).isRequired,
  nome: PropTypes.string,
  cor: PropTypes.string,
};

BarrasChart.defaultProps = {
  nome: "Valor",
  cor: themeConfig.primary,
};

/** Várias linhas (series: [{ nome, dados, cor, tracejada }]). */
export function LinhasChart({ rotulos, series }) {
  const dados = useMemo(() => series.map((s) => ({ name: s.nome, data: s.dados })), [series]);
  const options = useMemo(
    () => ({
      ...base,
      colors: series.map((s, i) => s.cor || PALETA[i % PALETA.length]),
      stroke: { width: series.map(() => 3), curve: "smooth", dashArray: series.map((s) => (s.tracejada ? 6 : 0)) },
      markers: { size: 0 },
      xaxis: { categories: rotulos, labels: { style: texto }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: texto, formatter: (v) => brlCompact(v) } },
      legend: { position: "top", horizontalAlign: "right", labels: { colors: themeConfig.fonts.primary } },
      tooltip: { theme: "dark", shared: true, intersect: false, y: { formatter: fmt } },
    }),
    [rotulos, series]
  );
  return <Chart options={options} series={dados} type="line" width="100%" height="100%" />;
}

LinhasChart.propTypes = {
  rotulos: PropTypes.arrayOf(PropTypes.string).isRequired,
  series: PropTypes.arrayOf(
    PropTypes.shape({
      nome: PropTypes.string.isRequired,
      dados: PropTypes.array.isRequired,
      cor: PropTypes.string,
      tracejada: PropTypes.bool,
    })
  ).isRequired,
};

/** Colunas empilhadas por série (ex.: patrimônio por conta). */
export function EmpilhadoChart({ rotulos, series }) {
  const dados = useMemo(() => series.map((s) => ({ name: s.nome, data: s.dados })), [series]);
  const options = useMemo(
    () => ({
      ...base,
      chart: { ...base.chart, stacked: true },
      colors: PALETA,
      plotOptions: { bar: { columnWidth: "55%", borderRadius: 3 } },
      xaxis: { categories: rotulos, labels: { style: texto }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: texto, formatter: (v) => brlCompact(v) } },
      legend: { position: "top", horizontalAlign: "right", labels: { colors: themeConfig.fonts.primary } },
      tooltip: { theme: "dark", shared: true, intersect: false, y: { formatter: fmt } },
    }),
    [rotulos]
  );
  return <Chart options={options} series={dados} type="bar" width="100%" height="100%" />;
}

EmpilhadoChart.propTypes = {
  rotulos: PropTypes.arrayOf(PropTypes.string).isRequired,
  series: PropTypes.arrayOf(PropTypes.shape({ nome: PropTypes.string.isRequired, dados: PropTypes.array.isRequired })).isRequired,
};
