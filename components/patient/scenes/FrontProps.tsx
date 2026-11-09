// Props seen straight on, at the far end of the corridor: elevator doors, an escalator, the
// destination door, and the landmark behind a turn. Drawn at a 180 × 210 design size with the
// base at y = 500, then scaled onto the far wall by Backdrop.

const CX = 200;

export function ElevatorDoors({ color, display }: { color: string; display?: string }) {
  return (
    <g>
      <rect x="136" y="300" width="128" height="200" rx="4" fill="#4b5762" />
      <rect x="146" y="324" width="108" height="176" fill={color} />
      <line x1={CX} y1="324" x2={CX} y2="500" stroke="#2f3a44" strokeWidth="4" />
      <rect x="146" y="324" width="52" height="176" fill="#fff" opacity="0.14" />
      {/* floor display */}
      <rect x="168" y="304" width="64" height="16" rx="3" fill="#10161c" />
      {display ? (
        <text x={CX} y="317" textAnchor="middle" fontSize="13" fontWeight="700" fill="#7dffb2" fontFamily="var(--f-mono), monospace">
          {display}
        </text>
      ) : (
        <polygon points="200,308 194,316 206,316" fill="#7dffb2" />
      )}
      {/* call buttons */}
      <circle cx="274" cy="410" r="5" fill="#f2f2f2" />
      <circle cx="274" cy="424" r="5" fill="#f2f2f2" />
    </g>
  );
}

export function AWingHall() {
  return (
    <g>
      <rect x="128" y="300" width="144" height="200" fill="#e4eaef" />
      {/* hanging sign */}
      <line x1="170" y1="290" x2="170" y2="312" stroke="#5d6b78" strokeWidth="3" />
      <line x1="230" y1="290" x2="230" y2="312" stroke="#5d6b78" strokeWidth="3" />
      <rect x="150" y="312" width="100" height="26" rx="4" fill="var(--lc)" />
      <text x={CX} y="331" textAnchor="middle" fontSize="19" fontWeight="800" fill="#fff" fontFamily="var(--f-display), sans-serif">A WING</text>
      <rect x="150" y="372" width="100" height="128" rx="3" fill="#9fb1c2" />
      <line x1={CX} y1="372" x2={CX} y2="500" stroke="#7b8b99" strokeWidth="3" />
    </g>
  );
}

export function FoodCourt() {
  const awn = ["#d2335f", "#fff", "#d2335f", "#fff", "#d2335f", "#fff"];
  return (
    <g>
      <rect x="116" y="324" width="168" height="176" fill="#f3e9d8" />
      {awn.map((c, i) => (
        <rect key={i} x={116 + i * 28} y="312" width="28" height="30" fill={c} />
      ))}
      {/* menu boards */}
      <rect x="130" y="352" width="46" height="34" rx="3" fill="#2f3a44" />
      <rect x="190" y="352" width="46" height="34" rx="3" fill="#2f3a44" />
      <g stroke="#f2a93b" strokeWidth="3" strokeLinecap="round">
        <line x1="138" y1="362" x2="168" y2="362" />
        <line x1="138" y1="372" x2="160" y2="372" />
        <line x1="198" y1="362" x2="228" y2="362" />
        <line x1="198" y1="372" x2="220" y2="372" />
      </g>
      <rect x="124" y="420" width="152" height="80" fill="#b98b5c" />
      {/* tables */}
      <ellipse cx="156" cy="486" rx="22" ry="7" fill="#fff" />
      <ellipse cx="248" cy="486" rx="22" ry="7" fill="#fff" />
    </g>
  );
}

export function YellowElevator() {
  return <ElevatorDoors color="#e8b21a" />;
}

export function GWing() {
  return (
    <g>
      <rect x="124" y="300" width="152" height="200" fill="#e0ece4" />
      <rect x="124" y="300" width="152" height="30" fill="#2b9646" />
      <text x={CX} y="322" textAnchor="middle" fontSize="19" fontWeight="800" fill="#fff" fontFamily="var(--f-display), sans-serif">G WING</text>
      <rect x="150" y="346" width="100" height="154" rx="3" fill="#b6d3e6" stroke="#5d6b78" strokeWidth="4" />
      <line x1={CX} y1="346" x2={CX} y2="500" stroke="#5d6b78" strokeWidth="4" />
      <rect x="182" y="410" width="6" height="30" rx="3" fill="#5d6b78" />
      <rect x="212" y="410" width="6" height="30" rx="3" fill="#5d6b78" />
    </g>
  );
}

export function Escalator() {
  const rungs = [0, 1, 2, 3, 4, 5, 6];
  return (
    <g>
      <rect x="116" y="320" width="168" height="180" fill="#2f3a44" />
      <polygon points="146,500 254,500 236,350 164,350" fill="#8590a0" />
      {rungs.map((i) => {
        const y = 500 - i * 20 - i * i * 1.2;
        const inset = 12 + i * 3;
        return <line key={i} x1={146 + inset * 0.5} y1={y} x2={254 - inset * 0.5} y2={y} stroke="#4b5762" strokeWidth="4" />;
      })}
      {/* handrails */}
      <polyline points="138,500 160,350" stroke="#10161c" strokeWidth="10" strokeLinecap="round" fill="none" />
      <polyline points="262,500 240,350" stroke="#10161c" strokeWidth="10" strokeLinecap="round" fill="none" />
      {/* hanging sign with a down arrow */}
      <rect x="168" y="298" width="64" height="26" rx="4" fill="#0a8282" />
      <path d="M200 303v14M193 311l7 7 7-7" stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

export function DestDoor() {
  return (
    <g>
      <rect x="146" y="312" width="108" height="188" rx="4" fill="#5d6b78" />
      <rect x="156" y="324" width="88" height="176" fill="#e8d2ad" />
      <rect x="168" y="340" width="26" height="46" rx="2" fill="#cfe6f3" />
      <rect x="206" y="340" width="26" height="46" rx="2" fill="#cfe6f3" />
      <circle cx="232" cy="420" r="5" fill="#8a6a2f" />
      {/* sign above the door */}
      <rect x="156" y="296" width="88" height="14" rx="3" fill="var(--lc)" />
    </g>
  );
}

/** The destination door on a side wall, in perspective (drawn in full-scene coordinates). */