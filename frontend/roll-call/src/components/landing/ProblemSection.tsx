export function ProblemSection() {
  return (
    <section id="problem" className="wrap">
      <div className="two-col reveal">
        <div>
          <p className="eyebrow">Entry 01 — why this exists</p>
          <h2>Spreadsheets don't know who's late.</h2>
          <p style={{ fontSize: '16.5px', opacity: 0.82, maxWidth: '48ch', marginTop: '16px' }}>
            Assignments live in shared drives, deadlines live in someone's memory, and grading
            feedback disappears into a chat thread. There's no single record of who was taught what,
            who submitted, and when — until now.
          </p>
        </div>
        <div
          className="glass"
          style={{
            padding: '30px',
            fontFamily: 'var(--font-mono)',
            fontSize: '13px',
            opacity: 0.75,
          }}
        >
          <div style={{ marginBottom: '10px' }}>— assignments.xlsx (v14-FINAL-final2)</div>
          <div style={{ marginBottom: '10px' }}>— "did you get my file?" (unread)</div>
          <div style={{ marginBottom: '10px' }}>— grade sheet, three versions, three answers</div>
          <div>— no record of the late submission that was "fine, just this once"</div>
        </div>
      </div>
    </section>
  );
}
