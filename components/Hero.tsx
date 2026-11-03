export default function Hero() {
  return (
    <header className="hero">
      <div className="hero-top">
        <div className="hero-nav">
          <div className="wordmark">IncidentRoom</div>
          <a className="btn" href="#sandbox">
            Open sandbox
          </a>
        </div>
      </div>
      <div className="hero-bottom">
        <p className="hero-copy">
          On-call closeout teammates in Switch chat. Triage, reproduce, propose
          rollback — nothing ships until a human Confirms.
        </p>
      </div>
      <h1 className="hero-headline hero-clip-light" aria-hidden="true">
        <span>
          <span className="line">CLOSE IT</span>
        </span>
        <span>
          <span className="line">IN CHAT</span>
        </span>
      </h1>
      <h1 className="hero-headline hero-clip-dark">
        <span>
          <span className="line">CLOSE IT</span>
        </span>
        <span>
          <span className="line">IN CHAT</span>
        </span>
      </h1>
    </header>
  );
}
