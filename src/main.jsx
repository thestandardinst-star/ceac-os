import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import ExperienceV2MotionProvider from "./experience-v2/ExperienceV2MotionProvider";
import "./styles.css";
import "./premium.css";
import "./premium-staff.css";
import "./premium-manager.css";
import "./premium-admin.css";
import "./premium-executive.css";
import "./premium-parity.css";
import "./experience-v2.css";

createRoot(document.getElementById("root")).render(\n  <React.StrictMode>\n    <ExperienceV2MotionProvider>\n      <App />\n    </ExperienceV2MotionProvider>\n  </React.StrictMode>\n);
