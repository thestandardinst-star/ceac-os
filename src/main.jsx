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
import "./experience-v2/shell/shell.css";
import "./experience-v2/staff-today/staff-today.css";
import "./experience-v2/manager-overview/manager-overview.css";
import "./experience-v2/admin-overview/admin-overview.css";
import "./experience-v2/executive-overview/executive-overview.css";
import "./experience-v2/work-family/work-family.css";
import "./experience-v2/people-family/people-family.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ExperienceV2MotionProvider>
      <App />
    </ExperienceV2MotionProvider>
  </React.StrictMode>
);
