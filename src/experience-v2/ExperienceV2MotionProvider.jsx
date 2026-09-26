import { MotionConfig } from "motion/react";

export default function ExperienceV2MotionProvider({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
}
