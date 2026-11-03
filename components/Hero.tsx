export function Hero() {
  return (
    <header className="hero">
      <div className="hero-field-top" />
      <div className="hero-field-bot" />
      <nav className="hero-nav">
        <a className="wordmark" href="#content">
          IncidentRoom
        </a>
        <a className="btn" href="#sandbox">
          Open sandbox
        </a>
      </nav>
      <div className="hero-copy dry">
        <div className="hero-headline">
          <h1 className="lines">
            <span className="line">
              <span data-line="" style={{ ["--i" as string]: 0 }}>
                CLOSE IT
              </span>
            </span>
            <span className="line">
              <span data-line="" style={{ ["--i" as string]: 1 }}>
                IN CHAT
              </span>
            </span>
          </h1>
        </div>
      </div>
      <div className="hero-copy wet" aria-hidden="true">
        <div className="hero-headline">
          <h1 className="lines">
            <span className="line">
              <span data-line="" style={{ ["--i" as string]: 0 }}>
                CLOSE IT
              </span>
            </span>
            <span className="line">
              <span data-line="" style={{ ["--i" as string]: 1 }}>
                IN CHAT
              </span>
            </span>
          </h1>
        </div>
      </div>
      <p className="hero-support">
        On-call closeout lives in the Switch room. Confirm is the only production gate.
      </p>
    </header>
  );
}
