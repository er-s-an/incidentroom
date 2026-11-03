export function HowItWorks() {
  return (
    <section className="how" id="how" data-reveal="">
      <div className="how-grid">
        <div className="how-copy">
          <h2>Close in chat</h2>
          <p>
            A checkout 500 is a Switch room, not a ticket pile. Three agents share the thread with
            the on-call. Production waits on a named Confirm.
          </p>
        </div>
        <article className="slip" aria-label="Closeout itinerary">
          <div className="slip-group">
            <h3>Minute 0</h3>
            <div className="itin-row">
              <span>Report in the room</span>
              <span className="leader" />
              <span className="when">12s</span>
            </div>
            <div className="itin-row">
              <span>Triager restates</span>
              <span className="leader" />
              <span className="when">20s</span>
            </div>
          </div>
          <div className="slip-group">
            <h3>Minute 2</h3>
            <div className="itin-row">
              <span>Reproducer runs the path</span>
              <span className="leader" />
              <span className="when">1m</span>
            </div>
            <div className="itin-row">
              <span>Evidence in the thread</span>
              <span className="leader" />
              <span className="when">40s</span>
            </div>
          </div>
          <div className="slip-group">
            <h3>Minute 6</h3>
            <div className="itin-row">
              <span>Release proposes rollback</span>
              <span className="leader" />
              <span className="when">30s</span>
            </div>
            <div className="itin-row">
              <span>Confirm, Edit, or Dismiss</span>
              <span className="leader" />
              <span className="when">wait</span>
            </div>
          </div>
          <p className="slip-end">
            <span>Incident closed in the same thread</span>
            <span>8 min</span>
          </p>
        </article>
      </div>
    </section>
  );
}
