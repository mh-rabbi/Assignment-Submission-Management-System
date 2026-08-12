export function RulesSection() {
  return (
    <section id="rules" className="wrap">
      <div className="section-head reveal">
        <p className="eyebrow">Entry 04 — the rules don't bend</p>
        <h2>The system holds the line, so people don't have to.</h2>
      </div>
      <div className="rule-grid reveal">
        <div className="glass-muted rule-card">
          <span className="q">RULE</span>
          A teacher can't grade a class they don't teach.
        </div>
        <div className="glass-muted rule-card">
          <span className="q">RULE</span>
          A closed assignment stops taking submissions — no exceptions, no back-channel.
        </div>
        <div className="glass-muted rule-card">
          <span className="q">RULE</span>
          Every edit to a submission is kept, not overwritten. Nothing quietly disappears.
        </div>
      </div>
    </section>
  );
}
