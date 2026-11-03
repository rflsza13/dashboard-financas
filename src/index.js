import React from "react";
import { createRoot} from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";

// Vision UI Dashboard React Context Provider
import { VisionUIControllerProvider } from "context";
import { FinanceProvider } from "context/finance";

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);


root.render(<BrowserRouter>
  <VisionUIControllerProvider>
    <FinanceProvider>
      <App />
    </FinanceProvider>
  </VisionUIControllerProvider>
</BrowserRouter>)

