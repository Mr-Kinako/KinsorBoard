// src/main.tsx

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Application } from "./app";
import "@/app/styles/global.scss";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Application />
  </StrictMode>,
);
