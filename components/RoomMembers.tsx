import type { Member } from "@/lib/sandbox/types";

export function RoomMembers({ members }: { members: Member[] }) {
  const online = members.filter((m) => m.online).length;
  return (
    <aside className="members">
      <h3>
        Members
        <span className="sr-only">{` ${online} online`}</span>
      </h3>
      <ul className="list">
        {members.map((member) => (
          <li key={member.id} className={member.online ? "member" : "member off"}>
            <span
              className={
                member.id === "human"
                  ? "avatar"
                  : member.online
                    ? "avatar agent"
                    : "avatar offline"
              }
              aria-hidden="true"
            >
              {member.initials}
            </span>
            <div>
              <strong>{member.name}</strong>
              <em>
                {member.role}
                {member.online ? " · online" : " · offline"}
              </em>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
