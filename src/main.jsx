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
import "./experience-v2/components/components.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ExperienceV2MotionProvider>
      <App />
    </ExperienceV2MotionProvider>
  </React.StrictMode>
);
