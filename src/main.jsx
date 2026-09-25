import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./premium.css";
import "./premium-staff.css";
import "./premium-manager.css";
import "./premium-admin.css";
import "./premium-executive.css";
import "./styles/tokens.css";
import "./styles/type.css";
import "./styles/motion.css";
import "./styles/base.css";
import "./styles/primitives.css";
import "./styles/shell.css";
import "./styles/patterns.css";

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
