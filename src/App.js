import { useState, useEffect } from "react";
import { Route, Switch, Redirect, useLocation } from "react-router-dom";
import { IoMenu } from "react-icons/io5";

import VuiBox from "components/VuiBox";
import Sidenav from "examples/Sidenav";
import themeConfig from "themeConfig";
import routes from "routes";
import { useVisionUIController, setMiniSidenav } from "context";
import { useFinance } from "context/finance";
import { aplicarTema, temaAtual } from "utils/tema";

export default function App() {
  const [controller, dispatch] = useVisionUIController();
  const { miniSidenav, layout, sidenavColor } = controller;
  const { config, recursos } = useFinance();
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const { pathname } = useLocation();

  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  useEffect(() => {
    aplicarTema(temaAtual());
  }, []);

  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const rotasAtivas = routes.filter((route) => !route.recurso || recursos[route.recurso]);

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        return <Route exact path={route.route} component={route.component} key={route.key} />;
      }

      return null;
    });

  return (
    <>
      {layout === "dashboard" && (
        <Sidenav
          color={sidenavColor}
          brandName={String(config.nomeSistema).toUpperCase()}
          routes={rotasAtivas}
          onMouseEnter={handleOnMouseEnter}
          onMouseLeave={handleOnMouseLeave}
        />
      )}
      {layout === "dashboard" && miniSidenav && (
        <VuiBox
          role="button"
          aria-label="Abrir menu"
          onClick={() => setMiniSidenav(dispatch, false)}
          sx={{
            display: { xs: "flex", xl: "none" },
            position: "fixed",
            top: "calc(12px + env(safe-area-inset-top, 0px))",
            left: "12px",
            zIndex: 1100,
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "14px",
            cursor: "pointer",
            background: themeConfig.cards.background,
            backdropFilter: themeConfig.cards.backdropFilter,
            WebkitBackdropFilter: themeConfig.cards.backdropFilter,
            border: `1px solid ${themeConfig.cards.borderColor}`,
          }}
        >
          <IoMenu size="24px" color="#ffffff" />
        </VuiBox>
      )}
      <Switch>
        {getRoutes(rotasAtivas)}
        <Redirect from="*" to="/dashboard" />
      </Switch>
    </>
  );
}
