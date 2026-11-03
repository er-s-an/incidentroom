export default function Footer() {
  return (
    <>
      <div className="footer-space" aria-hidden="true" />
      <footer className="footer">
        <div className="footer-cols">
          <div>
            <strong>IncidentRoom</strong>
            <p>Flip the Switch · Track 01</p>
            <p>Best Business Workflow</p>
          </div>
          <div>
            <strong>Product</strong>
            <a href="#how">How it works</a>
            <a href="#sandbox">Sandbox</a>
            <a href="#proof">Switch pieces</a>
          </div>
          <div>
            <strong>Switch</strong>
            <a
              href="https://docs.switchagents.ai/switch-rooms/getting-started"
              target="_blank"
              rel="noreferrer"
            >
              Getting started
            </a>
            <a
              href="https://github.com/sandbox-quantum/switch"
              target="_blank"
              rel="noreferrer"
            >
              switch repo
            </a>
            <a
              href="https://docs.switchagents.ai/switch-rooms/use-cases/incident-response"
              target="_blank"
              rel="noreferrer"
            >
              Incident response
            </a>
          </div>
          <div>
            <strong>Contest</strong>
            <a
              href="https://www.wemakedevs.org/hackathons/switch"
              target="_blank"
              rel="noreferrer"
            >
              WeMakeDevs hub
            </a>
            <a
              href="https://github.com/er-s-an/incidentroom"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
        <div />
        <div>
          <p className="footer-mark">IncidentRoom</p>
          <p className="footer-legal">
            MIT · Built for Flip the Switch · Demo mirrors Switch; agents run in
            Console. Atmosphere photo credited on-page.
          </p>
        </div>
      </footer>
    </>
  );
}
