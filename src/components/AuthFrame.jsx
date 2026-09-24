export default function AuthFrame({ eyebrow = "CEAC OS", title, description, children, footer }) {
  return <main className="auth-shell">
    <section className="auth-access" aria-label="Sign in">
      <div className="auth-access-inner">
        <div className="auth-mobile-wordmark">
          <strong>CEAC OS</strong>
          <span>Christ Embassy Airport City</span>
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

    <section className="auth-story" aria-label="CEAC OS identity">
      <div className="auth-story-inner">
        <div className="auth-brand-lockup">
          <strong>CEAC OS</strong>
          <span>Christ Embassy Airport City</span>
        </div>

        <div className="auth-story-copy">
          <div className="auth-story-kicker">One operating space</div>
          <h2>People.<br />Work.<br />Ministry.<br />Impact.</h2>
          <p>Know what matters. Move the work forward. Keep the record clear.</p>
        </div>

        <div className="auth-story-foot">
          <span>CEAC OS</span>
          <span>Secure organisational workspace</span>
        </div>

        <div className="auth-ambient" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
    </section>
  </main>;
}
