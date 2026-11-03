export function Footer() {
  return (
    <footer className="site-footer">
      <div className="foot-cols">
        <div>
          <h3>IncidentRoom</h3>
          <p>Track 01 · Best Business Workflow</p>
          <p>WeMakeDevs × Switch</p>
        </div>
        <div>
          <h3>Source</h3>
          <a href="https://github.com/er-s-an/incidentroom">GitHub</a>
          <a href="https://github.com/sandbox-quantum/switch">Switch on GitHub</a>
          <a href="/switch/incident-closeout.template.yaml">Room YAML</a>
        </div>
        <div>
          <h3>Switch</h3>
          <a href="https://docs.switchagents.ai/switch-rooms/getting-started">Getting started</a>
          <a href="https://docs.switchagents.ai/switch-rooms/use-cases/incident-response">
            Incident response
          </a>
          <a href="https://docs.switchagents.ai/switch-rooms">Switch Rooms</a>
        </div>
        <div>
          <h3>Hackathon</h3>
          <a href="https://www.wemakedevs.org/hackathons/switch">WeMakeDevs hub</a>
          <a href="#sandbox">Sandbox</a>
          <a href="#how">Close in chat</a>
        </div>
      </div>
      <p className="foot-mark" aria-hidden="true">
        IncidentRoom
      </p>
      <p className="foot-legal">
        Demo UI mirrors the Switch room. Real agents run via Switch Console and local Mattermost.
        No API keys on this page. Built for Flip the Switch, November 2026.
      </p>
    </footer>
  );
}
