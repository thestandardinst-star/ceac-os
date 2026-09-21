export function CEACMark({ compact = false }) {
  return <div className={`ceac-mark ${compact ? "compact" : ""}`} aria-hidden="true">
    <span className="ceac-mark-core">C</span>
    <span className="ceac-mark-dot" />
  </div>;
}

export default function AuthFrame({ eyebrow = "CEAC OS", title, description, children, footer }) {
  return <main className="auth-shell">
    <section className="auth-story" aria-label="CEAC OS">
      <div className="auth-story-inner">
        <div className="auth-brand-lockup">
          <CEACMark />
          <div>
            <strong>CEAC OS</strong>
            <span>Christ Embassy Airport City</span>
          </div>
        </div>

        <div className="auth-story-copy">
          <div className="auth-story-kicker">One operating space</div>
          <h2>Know what matters.<br />Move the work forward.</h2>
          <p>Work, projects, people, decisions and records stay connected — without turning the day into another reporting exercise.</p>
        </div>

        <div className="auth-story-rail" aria-hidden="true">
          <span><i />Work</span>
          <span><i />Projects</span>
          <span><i />Teams</span>
          <span><i />Records</span>
        </div>

        <div className="auth-story-foot">
          <span>CEAC OS</span>
          <span>Secure organisational workspace</span>
        </div>
      </div>
    </section>

    <section className="auth-access">
      <div className="auth-access-inner">
        <div className="auth-mobile-brand">
          <CEACMark compact />
          <div><strong>CEAC OS</strong><span>Airport City</span></div>
        </div>

        <div className="auth-card">
          <div className="auth-kicker">{eyebrow}</div>
          <h1>{title}</h1>
          {description && <p className="auth-description">{description}</p>}
          {children}
        </div>

        <div className="auth-access-foot">{footer || "Private workspace · Authorised CEAC accounts only"}</div>
      </div>
    </section>
  </main>;
}
