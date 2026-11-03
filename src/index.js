import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Root from "Root";
import { VisionUIControllerProvider } from "context";

const root = createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter>
    <VisionUIControllerProvider>
      <Root />
    </VisionUIControllerProvider>
  </BrowserRouter>
);
