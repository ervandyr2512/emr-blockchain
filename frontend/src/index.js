import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Reset browser defaults
const reset = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #f1f5f9; }
  button:disabled { opacity: 0.6; cursor: not-allowed !important; }
`;
const style = document.createElement("style");
style.textContent = reset;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);
