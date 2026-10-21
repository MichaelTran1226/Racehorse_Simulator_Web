import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import { IntroGate } from "./ui/IntroOverlay";
import "./ui/global.css";

const root = document.getElementById("root");
if (!root) throw new Error("Thiếu #root trong index.html");
createRoot(root).render(
  <StrictMode>
    <IntroGate>
      <App />
    </IntroGate>
  </StrictMode>,
);
