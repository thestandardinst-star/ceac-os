import { CeacIcon } from "../icons";
import { StatusBadge } from "../components";

const TONES = { success:"success", warning:"warning", danger:"danger", action:"action", neutral:"neutral" };

export function FinanceStatusBadge({ children, tone = "neutral" }) {
  return <StatusBadge tone={TONES[tone] || "neutral"} icon={false}>{children}</StatusBadge>;
}

export function FinancePageHeader({ eyebrow, title = "Finance", description, statusLabel, statusTone = "neutral" }) {
  return <header className="ev2fin-header">
    <div className="ev2fin-header-copy">
      {eyebrow ? <span className="ev2fin-eyebrow">{eyebrow}</span> : null}
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </div>
    {statusLabel ? <FinanceStatusBadge tone={statusTone}>{statusLabel}</FinanceStatusBadge> : null}
  </header>;
}

export function FinanceSection({ eyebrow, title, description, meta, children }) {
  return <section className="ev2fin-section">
    <div className="ev2fin-section-head">
      <div>{eyebrow ? <span>{eyebrow}</span> : null}<h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
      {meta ? <strong>{meta}</strong> : null}
    </div>
    <div className="ev2fin-section-body">{children}</div>
  </section>;
}

export function FinanceCurrencyCard({ currency, contextLabel, facts = [], children }) {
  return <article className="ev2fin-currency-card">
    <div className="ev2fin-currency-head">
      <div><span>Currency</span><strong>{currency}</strong></div>
      {contextLabel ? <small>{contextLabel}</small> : null}
    </div>
    <div className="ev2fin-facts">
      {facts.map((fact)=>{
        const Component=fact.onClick?"button":"div";
        return <Component key={fact.label} type={fact.onClick?"button":undefined} onClick={fact.onClick} className={fact.onClick?"is-interactive":""}>
          <span>{fact.label}</span><strong>{fact.value}</strong>{fact.detail?<small>{fact.detail}</small>:null}
          {fact.onClick?<CeacIcon name="chevronRight" size="meta" decorative />:null}
        </Component>;
      })}
    </div>
    {children?<div className="ev2fin-currency-extra">{children}</div>:null}
  </article>;
}

export function FinanceRecordRow({ icon="money", eyebrow, title, meta, note, statusLabel, statusTone="neutral", onClick, children, className="" }) {
  const Component=onClick?"button":"article";
  return <Component type={onClick?"button":undefined} onClick={onClick} className={`ev2fin-row row ${onClick?"is-interactive":""} ${className}`.trim()}>
    <span className="ev2fin-row-icon"><CeacIcon name={icon} size="row" decorative /></span>
    <span className="ev2fin-row-copy">{eyebrow?<small>{eyebrow}</small>:null}<strong>{title}</strong>{meta?<span>{meta}</span>:null}{note?<p>{note}</p>:null}</span>
    {statusLabel?<FinanceStatusBadge tone={statusTone}>{statusLabel}</FinanceStatusBadge>:null}
    {children?<span className="ev2fin-row-actions">{children}</span>:null}
  </Component>;
}

export function FinanceEmpty({ title, description }) {
  return <div className="ev2fin-empty"><span><CeacIcon name="money" size="feature" decorative /></span><div><strong>{title}</strong>{description?<p>{description}</p>:null}</div></div>;
}

export function FinanceFootnote({ children }) {
  return <p className="ev2fin-footnote">{children}</p>;
}
