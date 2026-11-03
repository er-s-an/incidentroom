export default function HowItWorks() {
  return (
    <section className="section how-wrap" id="how">
      <div className="grid-12">
        <div>
          <h2 className="how-title">From alert to Confirm</h2>
          <p className="how-copy">
            Switch keeps the whole incident in one room. Agents move the work;
            a person owns the production change.
          </p>
        </div>
        <div className="slip" aria-label="Closeout itinerary">
          <h3>Report</h3>
          <div className="slip-row">
            <span>Human posts checkout 500</span>
            <span className="dots" aria-hidden />
            <span>0:20</span>
          </div>
          <h3>Triage</h3>
          <div className="slip-row">
            <span>inc-triager classifies and routes</span>
            <span className="dots" aria-hidden />
            <span>1:00</span>
          </div>
          <div className="slip-row">
            <span>Open reports stay in the reply</span>
            <span className="dots" aria-hidden />
            <span>—</span>
          </div>
          <h3>Reproduce</h3>
          <div className="slip-row">
            <span>inc-repro runs the smallest check</span>
            <span className="dots" aria-hidden />
            <span>3:00</span>
          </div>
          <h3>Propose</h3>
          <div className="slip-row">
            <span>inc-release drafts rollback</span>
            <span className="dots" aria-hidden />
            <span>4:00</span>
          </div>
          <div className="slip-total">
            <span>Human Confirm · incident closed</span>
            <span>~5 min</span>
          </div>
        </div>
      </div>
    </section>
  );
}
