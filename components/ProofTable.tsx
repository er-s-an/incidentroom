const ROWS = [
  {
    surface: "YAML",
    artifact: "incident-closeout.template.yaml",
    proves: "Three agents plus the creator share one Switch room",
    acts: "Console creates them",
  },
  {
    surface: "Room",
    artifact: "Mattermost channel via the bridge",
    proves: "The demo UI mirrors this thread; the real one is the room",
    acts: "On-call and agents",
  },
  {
    surface: "Gate",
    artifact: "Confirm / Edit / Dismiss",
    proves: "A production change waits for a named person",
    acts: "Release agent waits",
  },
  {
    surface: "Console",
    artifact: "Switch Console + local Docker",
    proves: "Real agents run on your machine, not on this page",
    acts: "You",
  },
  {
    surface: "Docs",
    artifact: "Incident-response use case",
    proves: "Page the human before a production change",
    acts: "Instructions, not enforcement",
  },
  {
    surface: "History",
    artifact: "Durable room messages",
    proves: "The next shift inherits detection, diagnosis, and Confirm",
    acts: "Whoever opens the room",
  },
];

export function ProofTable() {
  return (
    <section className="proof" id="proof" data-reveal="">
      <h2>
        Switch holds
        <span>the thread</span>
      </h2>
      <table className="proof-table">
        <thead>
          <tr>
            <th>Surface</th>
            <th>Artifact</th>
            <th>What it proves</th>
            <th>Who acts</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.surface}>
              <td>{row.surface}</td>
              <td>{row.artifact}</td>
              <td>{row.proves}</td>
              <td>{row.acts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
