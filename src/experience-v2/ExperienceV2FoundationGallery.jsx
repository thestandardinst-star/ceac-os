import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CEAC_ICON_SIZES, CeacIcon } from "./icons";
import { EV2_TRANSITIONS } from "./motion";

const ICON_PROOF = [
  "home", "work", "team", "projects", "calendar", "finance",
  "reports", "ministry", "learning", "assets", "compliance",
  "search", "create", "notification", "more", "warning", "check",
];

const SIZE_PROOF = ["meta", "row", "nav", "feature"];

export default function ExperienceV2FoundationGallery() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="ev2-foundation ev2-gallery" aria-labelledby="ev2-foundation-title">
      <header className="ev2-gallery-header">
        <div>
          <div className="ev2-gallery-kicker">Experience V2 · design reference</div>
          <h2 id="ev2-foundation-title" className="ev2-type-page">Foundation quality proof</h2>
          <p className="ev2-type-body ev2-gallery-intro">
            Reference only — the content below demonstrates typography, spacing, iconography,
            density and motion. It is not live CEAC operational data.
          </p>
        </div>
        <span className="ev2-gallery-badge">Stage 2</span>
      </header>

      <div className="ev2-gallery-grid">
        <section className="ev2-gallery-panel ev2-gallery-panel-type" aria-labelledby="ev2-type-title">
          <div className="ev2-gallery-panel-head">
            <div>
              <div className="ev2-type-label">Typography</div>
              <h3 id="ev2-type-title" className="ev2-type-card">One hierarchy across roles</h3>
            </div>
            <CeacIcon name="reports" size="feature" decorative />
          </div>

          <div className="ev2-type-proof">
            <p className="ev2-type-display">Display moment</p>
            <p className="ev2-type-page">Page title</p>
            <p className="ev2-type-section">Section title</p>
            <p className="ev2-type-card">Card title</p>
            <p className="ev2-type-row">Operational row title</p>
            <p className="ev2-type-body">Body copy stays compact, readable and calm.</p>
            <p className="ev2-type-supporting">Supporting context uses less contrast, not tiny text.</p>
            <p className="ev2-type-label">Label / eyebrow</p>
          </div>
        </section>

        <section className="ev2-gallery-panel ev2-gallery-panel-icons" aria-labelledby="ev2-icons-title">
          <div className="ev2-gallery-panel-head">
            <div>
              <div className="ev2-type-label">Iconography</div>
              <h3 id="ev2-icons-title" className="ev2-type-card">One semantic icon language</h3>
            </div>
            <span className="ev2-type-supporting">Stroke 1.75</span>
          </div>

          <div className="ev2-icon-proof-grid">
            {ICON_PROOF.map((name) => (
              <div className="ev2-icon-proof-item" key={name}>
                <span className="ev2-icon-box ev2-icon-box-soft">
                  <CeacIcon name={name} size="nav" decorative />
                </span>
                <span className="ev2-type-label">{name}</span>
              </div>
            ))}
          </div>

          <div className="ev2-size-proof" aria-label="Icon size roles">
            {SIZE_PROOF.map((size) => (
              <span className="ev2-size-proof-item" key={size}>
                <CeacIcon name="work" size={size} decorative />
                <span className="ev2-type-supporting">{size} · {CEAC_ICON_SIZES[size]}px</span>
              </span>
            ))}
          </div>
        </section>

        <section className="ev2-gallery-panel" aria-labelledby="ev2-controls-title">
          <div className="ev2-gallery-panel-head">
            <div>
              <div className="ev2-type-label">Controls</div>
              <h3 id="ev2-controls-title" className="ev2-type-card">Clear hierarchy, full hit areas</h3>
            </div>
          </div>

          <div className="ev2-control-stack">
            <div className="ev2-control-row">
              <button className="ev2-button ev2-button-primary ev2-focus-ring" type="button">
                <CeacIcon name="create" size="control" decorative />
                Primary action
              </button>
              <button className="ev2-button ev2-button-secondary ev2-focus-ring" type="button">
                Secondary
              </button>
              <button className="ev2-icon-action ev2-focus-ring" type="button" aria-label="Reference notifications">
                <CeacIcon name="notification" size="nav" decorative />
              </button>
            </div>

            <label className="ev2-field">
              <span className="ev2-type-label">Reference input</span>
              <input className="ev2-input ev2-focus-ring" defaultValue="Design-system sample" />
            </label>

            <button className="ev2-button ev2-button-secondary" type="button" disabled>
              Disabled state
            </button>
          </div>
        </section>

        <section className="ev2-gallery-panel" aria-labelledby="ev2-surfaces-title">
          <div className="ev2-gallery-panel-head">
            <div>
              <div className="ev2-type-label">Surfaces</div>
              <h3 id="ev2-surfaces-title" className="ev2-type-card">Cards only where structure needs them</h3>
            </div>
          </div>

          <div className="ev2-surface-proof">
            <div className="ev2-reference-stat">
              <span className="ev2-icon-box ev2-icon-box-action"><CeacIcon name="chart" size="nav" decorative /></span>
              <div>
                <span className="ev2-type-label">Reference KPI</span>
                <strong className="ev2-reference-value">24</strong>
                <span className="ev2-type-supporting">Sample value — not live data</span>
              </div>
            </div>

            <div className="ev2-reference-row">
              <span className="ev2-icon-box ev2-icon-box-soft"><CeacIcon name="work" size="row" decorative /></span>
              <div className="ev2-reference-row-copy">
                <span className="ev2-type-row">Compact operational row</span>
                <span className="ev2-type-supporting">Metadata stays close to the item it explains.</span>
              </div>
              <CeacIcon name="chevronRight" size="meta" decorative />
            </div>

            <div className="ev2-status-row" aria-label="Semantic status examples">
              <span className="ev2-status ev2-status-success"><CeacIcon name="check" size="meta" decorative />Success</span>
              <span className="ev2-status ev2-status-warning"><CeacIcon name="warning" size="meta" decorative />Attention</span>
              <span className="ev2-status ev2-status-danger"><CeacIcon name="error" size="meta" decorative />Issue</span>
            </div>
          </div>
        </section>

        <section className="ev2-gallery-panel ev2-gallery-panel-wide" aria-labelledby="ev2-density-title">
          <div className="ev2-gallery-panel-head">
            <div>
              <div className="ev2-type-label">Density</div>
              <h3 id="ev2-density-title" className="ev2-type-card">Priority first, supporting work compact</h3>
            </div>
            <span className="ev2-type-supporting">Reference pattern</span>
          </div>

          <div className="ev2-density-cluster">
            <div className="ev2-density-priority">
              <div className="ev2-density-priority-icon"><CeacIcon name="task" size="feature" decorative /></div>
              <div>
                <span className="ev2-type-label">Primary attention pattern</span>
                <div className="ev2-type-section">One clear next action</div>
                <p className="ev2-type-supporting">A focused item gets emphasis; the supporting queue stays compact.</p>
              </div>
              <button className="ev2-button ev2-button-primary ev2-focus-ring" type="button">Reference action</button>
            </div>

            <div className="ev2-density-list">
              {[
                ["calendar", "Supporting row A", "Schedule context"],
                ["people", "Supporting row B", "People context"],
                ["reports", "Supporting row C", "Reporting context"],
              ].map(([icon, title, meta]) => (
                <div className="ev2-reference-row ev2-reference-row-plain" key={title}>
                  <CeacIcon name={icon} size="row" decorative />
                  <div className="ev2-reference-row-copy">
                    <span className="ev2-type-row">{title}</span>
                    <span className="ev2-type-supporting">{meta}</span>
                  </div>
                  <CeacIcon name="chevronRight" size="meta" decorative />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ev2-gallery-panel ev2-gallery-panel-motion" aria-labelledby="ev2-motion-title">
          <div className="ev2-gallery-panel-head">
            <div>
              <div className="ev2-type-label">Motion</div>
              <h3 id="ev2-motion-title" className="ev2-type-card">State change with spatial continuity</h3>
            </div>
          </div>

          <motion.div className="ev2-motion-proof" layout transition={EV2_TRANSITIONS.reflow}>
            <motion.button
              className="ev2-motion-trigger ev2-focus-ring"
              type="button"
              layout
              onClick={() => setExpanded((value) => !value)}
              transition={EV2_TRANSITIONS.reflow}
              aria-expanded={expanded}
            >
              <span className="ev2-icon-box ev2-icon-box-identity"><CeacIcon name="task" size="row" decorative /></span>
              <span className="ev2-reference-row-copy">
                <span className="ev2-type-row">{expanded ? "Reference state expanded" : "Reference state compact"}</span>
                <span className="ev2-type-supporting">Tap to prove layout reflow.</span>
              </span>
              <CeacIcon name={expanded ? "chevronUp" : "chevronDown"} size="meta" decorative />
            </motion.button>

            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  className="ev2-motion-detail"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={EV2_TRANSITIONS.standard}
                >
                  <span className="ev2-type-body">Reference detail</span>
                  <span className="ev2-type-supporting">The surrounding content moves instead of abruptly jumping.</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div className="ev2-motion-footer" layout transition={EV2_TRANSITIONS.reflow}>
              <CeacIcon name="info" size="meta" decorative />
              <span className="ev2-type-supporting">Reduced-motion preference is respected by the app-level MotionConfig.</span>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </section>
  );
}
