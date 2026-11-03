export function Cta() {
  return (
    <section className="cta" aria-labelledby="cta-title">
      <h2 id="cta-title">
        INCIDENT
        <br />
        CLOSED
      </h2>
      <div className="cta-foot">
        <p>Run the room with a 500, a timeout, or a latency canary. Confirm still waits.</p>
        <a className="btn" href="#sandbox">
          Open sandbox
        </a>
      </div>
    </section>
  );
}
