import Link from "next/link";

type AuthBrandPanelProps = {
  headline: string;
  subtext: string;
  testimonial: {
    quote: string;
    name: string;
    role: string;
    initials: string;
  };
};

export default function AuthBrandPanel({
  headline,
  subtext,
  testimonial,
}: AuthBrandPanelProps) {
  return (
    <div className="auth-brand-panel">
      <Link href="/" className="auth-brand-logo">
        Leadbot<span style={{ color: "var(--auth-accent)" }}>Partners</span>
      </Link>

      <div className="auth-brand-content">
        <h2 className="auth-brand-headline">{headline}</h2>
        <p className="auth-brand-text">{subtext}</p>

        <div className="auth-brand-testimonial">
          <p className="auth-brand-quote">&ldquo;{testimonial.quote}&rdquo;</p>
          <div className="auth-brand-author">
            <div className="auth-brand-avatar">{testimonial.initials}</div>
            <div>
              <p className="auth-brand-author-name">{testimonial.name}</p>
              <p className="auth-brand-author-role">{testimonial.role}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-brand-footer">
        <div className="auth-brand-stats">
          <div>
            <span className="auth-brand-stat-value">2,000+</span>
            <span className="auth-brand-stat-label">Chatbots built</span>
          </div>
          <div>
            <span className="auth-brand-stat-value">1M+</span>
            <span className="auth-brand-stat-label">Leads captured</span>
          </div>
          <div>
            <span className="auth-brand-stat-value">5 min</span>
            <span className="auth-brand-stat-label">Avg. setup</span>
          </div>
        </div>
      </div>
    </div>
  );
}
