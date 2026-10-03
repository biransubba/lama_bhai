import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";

import * as imageProcessor from "./utils/imageProcessor.js";

if (typeof window !== "undefined") {
  window.__imageProcessor = imageProcessor;
}

const root = createRoot(document.getElementById("root"));
root.render(<App />);