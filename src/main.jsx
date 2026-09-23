import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./premium.css";
import "./premium-staff.css";
import "./premium-manager.css";
import "./premium-admin.css";
import "./premium-executive.css";
import "./visual-parity.css";

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
