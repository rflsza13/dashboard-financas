import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

import App from "App";
import theme from "assets/theme";
import Login from "layouts/login";
import { AuthProvider, useAuth } from "context/auth";
import { FinanceProvider } from "context/finance";

function Portao() {
  const { liberado, usuario } = useAuth();
  if (!liberado) return <Login />;
  return (
    <FinanceProvider key={usuario ? usuario.email : "local"}>
      <App />
    </FinanceProvider>
  );
}

export default function Root() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Portao />
      </AuthProvider>
    </ThemeProvider>
  );
}
