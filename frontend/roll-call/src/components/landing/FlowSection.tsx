export function FlowSection() {
  return (
    <section id="flow" className="wrap">
      <div className="section-head reveal">
        <p className="eyebrow">Entry 03 — the flow</p>
        <h2>From draft to grade, in order.</h2>
      </div>
      <div className="glass flow reveal">
        <div className="flow-node">
          <span className="tag">01</span>
          <h4>Draft</h4>
          <p>Teacher builds the assignment. Not visible to students yet.</p>
        </div>
        <div className="flow-node">
          <span className="tag">02</span>
          <h4>Published</h4>
          <p>Visible to the assigned class. Students can submit.</p>
        </div>
        <div className="flow-node">
          <span className="tag">03</span>
          <h4>Submitted</h4>
          <p>Late is fine — if the teacher allows it. Otherwise, the deadline holds.</p>
        </div>
        <div className="flow-node">
          <span className="tag">04</span>
          <h4>Graded / Closed</h4>
          <p>Marks and feedback recorded. Closed stops new submissions, no exceptions.</p>
        </div>
      </div>
    </section>
  );
}
