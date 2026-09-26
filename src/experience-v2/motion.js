export const EV2_MOTION = Object.freeze({
  duration: Object.freeze({
    press: 0.12,
    fast: 0.16,
    standard: 0.22,
    surface: 0.28,
    complex: 0.32,
  }),
  ease: Object.freeze({
    standard: [0.2, 0.8, 0.2, 1],
    enter: [0.16, 1, 0.3, 1],
    exit: [0.4, 0, 1, 1],
  }),
  spring: Object.freeze({
    layout: Object.freeze({
      type: "spring",
      stiffness: 420,
      damping: 34,
      mass: 0.8,
    }),
  }),
});

export const EV2_TRANSITIONS = Object.freeze({
  press: Object.freeze({
    duration: EV2_MOTION.duration.press,
    ease: EV2_MOTION.ease.standard,
  }),
  fast: Object.freeze({
    duration: EV2_MOTION.duration.fast,
    ease: EV2_MOTION.ease.standard,
  }),
  standard: Object.freeze({
    duration: EV2_MOTION.duration.standard,
    ease: EV2_MOTION.ease.standard,
  }),
  panel: Object.freeze({
    duration: EV2_MOTION.duration.surface,
    ease: EV2_MOTION.ease.enter,
  }),
  exit: Object.freeze({
    duration: EV2_MOTION.duration.fast,
    ease: EV2_MOTION.ease.exit,
  }),
  reflow: EV2_MOTION.spring.layout,
});
