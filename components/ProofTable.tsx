export default function ProofTable() {
  return (
    <section className="section proof" id="proof">
      <div className="grid-12" style={{ display: "block" }}>
        <h2>
          Switch
          <span>is the room</span>
        </h2>
        <table className="proof-table">
          <thead>
            <tr>
              <th>Piece</th>
              <th>What it is</th>
              <th>Where it lives</th>
              <th className="right">Without Switch</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Room YAML</td>
              <td>triager · repro · release + creator</td>
              <td>switch/incident-closeout.template.yaml</td>
              <td className="right">No shared agents</td>
            </tr>
            <tr>
              <td>Console</td>
              <td>Starts agent sessions on demand</td>
              <td>Switch Console desktop</td>
              <td className="right">No runtime</td>
            </tr>
            <tr>
              <td>Mattermost</td>
              <td>Local messaging bridge (Docker)</td>
              <td>Bundled with local server</td>
              <td className="right">No thread</td>
            </tr>
            <tr>
              <td>Confirm gate</td>
              <td>Human owns production change</td>
              <td>In-room decision</td>
              <td className="right">Silent autopilot</td>
            </tr>
            <tr>
              <td>This demo</td>
              <td>Interactive mirror with recompute</td>
              <td>Vercel public page</td>
              <td className="right">Still needs Switch</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
