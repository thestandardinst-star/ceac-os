import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { EV2_TRANSITIONS } from "../motion";

export function MotionDisclosure({
  open,
  children,
  className = "",
  ariaLabel,
}) {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? { duration: 0 } : EV2_TRANSITIONS.standard;

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          className={`ev2c-disclosure ${className}`.trim()}
          aria-label={ariaLabel}
          initial={reduceMotion ? { opacity: 1 } : { height: 0, opacity: 0 }}
          animate={reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={transition}
        >
          <div className="ev2c-disclosure-inner">{children}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default MotionDisclosure;
