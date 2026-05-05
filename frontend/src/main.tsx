import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Apply persisted theme before first render to avoid flash
const savedTheme = localStorage.getItem("cosmo_theme");
if (savedTheme && savedTheme !== "default") {
  document.documentElement.setAttribute("data-theme", savedTheme);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
