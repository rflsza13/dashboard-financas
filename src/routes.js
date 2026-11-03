import Dashboard from "layouts/dashboard";
import Mes from "layouts/mes";
import Planilha from "layouts/planilha";
import Recorrencias from "layouts/recorrencias";
import Cartoes from "layouts/cartoes";
import Orcamento from "layouts/orcamento";
import Objetivos from "layouts/objetivos";
import Patrimonio from "layouts/patrimonio";
import Comparativo from "layouts/comparativo";
import Cenarios from "layouts/cenarios";
import Importar from "layouts/importar";
import Configuracoes from "layouts/configuracoes";

import {
  IoHome,
  IoCalendar,
  IoGrid,
  IoRepeat,
  IoCard,
  IoPieChart,
  IoFlag,
  IoBusiness,
  IoGitCompare,
  IoFlask,
  IoCloudUpload,
  IoSettings,
} from "react-icons/io5";

const item = (name, key, Icone, component, recurso) => ({
  type: "collapse",
  name,
  key,
  route: `/${key}`,
  icon: <Icone size="15px" color="inherit" />,
  component,
  noCollapse: true,
  ...(recurso ? { recurso } : {}),
});

const routes = [
  item("Dashboard", "dashboard", IoHome, Dashboard),
  item("Resumo mensal", "mes", IoCalendar, Mes),
  item("Planilha", "planilha", IoGrid, Planilha),
  item("Recorrências", "recorrencias", IoRepeat, Recorrencias),
  item("Cartões", "cartoes", IoCard, Cartoes, "cartoes"),
  item("Orçamento", "orcamento", IoPieChart, Orcamento, "orcamento"),
  item("Objetivos", "objetivos", IoFlag, Objetivos, "objetivos"),
  item("Patrimônio", "patrimonio", IoBusiness, Patrimonio, "patrimonio"),
  item("Comparativo", "comparativo", IoGitCompare, Comparativo, "comparativo"),
  item("Cenários", "cenarios", IoFlask, Cenarios, "cenarios"),
  item("Importar extrato", "importar", IoCloudUpload, Importar, "importar"),
  item("Configurações", "configuracoes", IoSettings, Configuracoes),
];

export default routes;
