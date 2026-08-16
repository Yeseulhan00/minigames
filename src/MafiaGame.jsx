import React, { useState, useEffect, useRef } from "react";
import { Eye, Shield, Stethoscope, Users, Skull, Moon, Sun, ChevronRight, Plus, Minus, RotateCcw, Fingerprint, Vote } from "lucide-react";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,600&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
`;

const COLORS = {
  ink: "#0A0D12",
  panel: "#12161F",
  panelAlt: "#181D28",
  hairline: "#2A303C",
  text: "#EDE7DA",
  muted: "#8890A0",
  mafia: "#9B2739",
  mafiaDim: "#3D1620",
  police: "#C79A3E",
  policeDim: "#3A2E14",
  doctor: "#3E7C74",
  doctorDim: "#122724",
  citizen: "#5A6D95",
  citizenDim: "#1B2233",
};

const ROLE_META = {
  mafia: { label: "마피아", color: COLORS.mafia, dim: COLORS.mafiaDim, icon: Skull,
    desc: "밤마다 눈을 뜨고 시민 한 명을 지목해 제거합니다. 다른 마피아가 누구인지 알고 있습니다.", team: "마피아 팀" },
  police: { label: "경찰", color: COLORS.police, dim: COLORS.policeDim, icon: Shield,
    desc: "밤마다 한 사람을 지목해 마피아인지 아닌지 확인할 수 있습니다.", team: "시민 팀" },
  doctor: { label: "의사", color: COLORS.doctor, dim: COLORS.doctorDim, icon: Stethoscope,
    desc: "밤마다 한 사람을 지목해 마피아의 공격으로부터 보호합니다. 자신도 선택할 수 있습니다.", team: "시민 팀" },
  citizen: { label: "시민", color: COLORS.citizen, dim: COLORS.citizenDim, icon: Users,
    desc: "특별한 능력은 없습니다. 대화와 추리로 마피아를 찾아내 투표로 처형해야 합니다.", team: "시민 팀" },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function Stamp({ text, color }) {
  return (
    <div
      style={{
        position: "absolute", top: "38%", left: "50%",
        transform: "translate(-50%, -50%) rotate(-14deg)",
        border: `3px solid ${color}`, color, borderRadius: 10,
        padding: "6px 18px", fontFamily: "'JetBrains Mono', monospace",
        fontWeight: 700, letterSpacing: 4, fontSize: 13, opacity: 0.85,
        whiteSpace: "nowrap", pointerEvents: "none",
      }}
    >
      {text}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: COLORS.panel, border: `1px solid ${COLORS.hairline}`,
        borderRadius: 16, ...style,
      }}
    >
      {children}
    </div>
  );
}

function Button({ children, onClick, variant = "primary", disabled, icon: Icon, style }) {
  const base = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 15,
    padding: "14px 20px", borderRadius: 12, border: "none", cursor: disabled ? "default" : "pointer",
    width: "100%", transition: "transform 0.1s ease, opacity 0.2s ease",
    opacity: disabled ? 0.4 : 1,
  };
  const variants = {
    primary: { background: COLORS.text, color: COLORS.ink },
    ghost: { background: "transparent", color: COLORS.text, border: `1px solid ${COLORS.hairline}` },
    danger: { background: COLORS.mafia, color: "#fff" },
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.98)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
}

function Stepper({ label, value, onDec, onInc, min = 0, max = 99, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 4px" }}>
      <span style={{ color: COLORS.text, fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 500 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={onDec} disabled={value <= min}
          style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${COLORS.hairline}`, background: COLORS.panelAlt, color: COLORS.text, opacity: value <= min ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Minus size={14} />
        </button>
        <span style={{ color: color || COLORS.text, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 17, width: 20, textAlign: "center" }}>{value}</span>
        <button onClick={onInc} disabled={value >= max}
          style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${COLORS.hairline}`, background: COLORS.panelAlt, color: COLORS.text, opacity: value >= max ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export default function MafiaGame() {
  const [screen, setScreen] = useState("setup");
  const [playerCount, setPlayerCount] = useState(8);
  const [names, setNames] = useState(Array.from({ length: 8 }, (_, i) => `플레이어 ${i + 1}`));
  const [roleCounts, setRoleCounts] = useState({ mafia: 2, police: 1, doctor: 1 });
  const [assignments, setAssignments] = useState([]);
  const [revealIndex, setRevealIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);

  // moderator state
  const [round, setRound] = useState(1);
  const [nightStepIdx, setNightStepIdx] = useState(0);
  const [phase, setPhase] = useState("night"); // night | day
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const intervalRef = useRef(null);

  const citizenCount = Math.max(0, playerCount - roleCounts.mafia - roleCounts.police - roleCounts.doctor);
  const totalAssigned = roleCounts.mafia + roleCounts.police + roleCounts.doctor + citizenCount;

  useEffect(() => {
    setNames((prev) => {
      const next = [...prev];
      while (next.length < playerCount) next.push(`플레이어 ${next.length + 1}`);
      return next.slice(0, playerCount);
    });
  }, [playerCount]);

  useEffect(() => {
    if (timerActive) {
      intervalRef.current = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerActive]);

  useEffect(() => {
    if (seconds === 0 && timerActive) setTimerActive(false);
  }, [seconds, timerActive]);

  function startAssign() {
    const pool = [
      ...Array(roleCounts.mafia).fill("mafia"),
      ...Array(roleCounts.police).fill("police"),
      ...Array(roleCounts.doctor).fill("doctor"),
      ...Array(citizenCount).fill("citizen"),
    ];
    const shuffled = shuffle(pool);
    setAssignments(shuffled);
    setRevealIndex(0);
    setHasRevealed(false);
    setHeld(false);
    setScreen("reveal");
  }

  function nextReveal() {
    if (revealIndex < playerCount - 1) {
      setRevealIndex((i) => i + 1);
      setHasRevealed(false);
      setHeld(false);
    } else {
      setScreen("handoff");
    }
  }

  const nightSteps = [];
  nightSteps.push({ text: "모두 눈을 감으세요.", sub: "게임 진행자만 눈을 뜨고 있습니다.", icon: Moon, color: COLORS.muted });
  if (roleCounts.mafia > 0) {
    nightSteps.push({ text: "마피아는 눈을 뜨세요.", sub: "제거할 사람을 손가락으로 지목하세요.", icon: Skull, color: COLORS.mafia });
    nightSteps.push({ text: "마피아는 눈을 감으세요.", sub: "", icon: Moon, color: COLORS.muted });
  }
  if (roleCounts.police > 0) {
    nightSteps.push({ text: "경찰은 눈을 뜨세요.", sub: "확인하고 싶은 사람을 지목하세요.", icon: Shield, color: COLORS.police });
    nightSteps.push({ text: "경찰은 눈을 감으세요.", sub: "", icon: Moon, color: COLORS.muted });
  }
  if (roleCounts.doctor > 0) {
    nightSteps.push({ text: "의사는 눈을 뜨세요.", sub: "보호할 사람을 지목하세요.", icon: Stethoscope, color: COLORS.doctor });
    nightSteps.push({ text: "의사는 눈을 감으세요.", sub: "", icon: Moon, color: COLORS.muted });
  }
  nightSteps.push({ text: "모두 눈을 뜨세요.", sub: `아침이 밝았습니다 — ${round}라운드 낮`, icon: Sun, color: COLORS.police });

  function advanceNight() {
    if (nightStepIdx < nightSteps.length - 1) {
      setNightStepIdx((i) => i + 1);
    } else {
      setPhase("day");
      setSeconds(180);
      setTimerActive(false);
      setNightStepIdx(0);
    }
  }

  function startVote() {
    setPhase("vote");
    setSeconds(60);
    setTimerActive(false);
  }

  function nextRound() {
    setRound((r) => r + 1);
    setPhase("night");
    setNightStepIdx(0);
    setSeconds(0);
    setTimerActive(false);
  }

  function fmt(s) {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${m}:${ss}`;
  }

  const outer = {
    minHeight: "100vh", background: COLORS.ink, color: COLORS.text,
    fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column",
    alignItems: "center", padding: "28px 18px 40px",
    backgroundImage: "radial-gradient(ellipse at 50% -10%, #1a2130 0%, #0A0D12 60%)",
  };

  // ---------- SETUP ----------
  if (screen === "setup") {
    const valid = totalAssigned === playerCount && roleCounts.mafia >= 1 && playerCount >= 4;
    return (
      <div style={outer}>
        <style>{FONTS}</style>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ textAlign: "center", marginBottom: 28, marginTop: 8 }}>
            <Fingerprint size={30} color={COLORS.police} style={{ marginBottom: 10 }} />
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 34, letterSpacing: 1 }}>
              마피아 게임
            </div>
            <div style={{ color: COLORS.muted, fontSize: 13, letterSpacing: 3, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
              CONFIDENTIAL · CASE FILE
            </div>
          </div>

          <Card style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>인원 수</div>
            <Stepper label="플레이어" value={playerCount} onDec={() => setPlayerCount((p) => Math.max(4, p - 1))} onInc={() => setPlayerCount((p) => Math.min(20, p + 1))} min={4} max={20} />
          </Card>

          <Card style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>역할 구성</div>
            <div style={{ height: 1, background: COLORS.hairline, margin: "8px 0" }} />
            <Stepper label="마피아" value={roleCounts.mafia} color={COLORS.mafia}
              onDec={() => setRoleCounts((r) => ({ ...r, mafia: Math.max(1, r.mafia - 1) }))}
              onInc={() => setRoleCounts((r) => ({ ...r, mafia: r.mafia + 1 }))} min={1} />
            <Stepper label="경찰" value={roleCounts.police} color={COLORS.police}
              onDec={() => setRoleCounts((r) => ({ ...r, police: Math.max(0, r.police - 1) }))}
              onInc={() => setRoleCounts((r) => ({ ...r, police: r.police + 1 }))} min={0} />
            <Stepper label="의사" value={roleCounts.doctor} color={COLORS.doctor}
              onDec={() => setRoleCounts((r) => ({ ...r, doctor: Math.max(0, r.doctor - 1) }))}
              onInc={() => setRoleCounts((r) => ({ ...r, doctor: r.doctor + 1 }))} min={0} />
            <div style={{ height: 1, background: COLORS.hairline, margin: "8px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 4px 2px", fontSize: 14 }}>
              <span style={{ color: COLORS.muted }}>시민 (자동 계산)</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: citizenCount < 0 ? COLORS.mafia : COLORS.citizen }}>{citizenCount}</span>
            </div>
            {!valid && (
              <div style={{ color: COLORS.mafia, fontSize: 12, marginTop: 8, fontFamily: "'JetBrains Mono', monospace" }}>
                ⚠ 역할 합계가 인원 수를 초과했습니다
              </div>
            )}
          </Card>

          <Card style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 17, marginBottom: 10 }}>플레이어 이름</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {names.map((n, i) => (
                <input
                  key={i}
                  value={n}
                  onChange={(e) => setNames((prev) => prev.map((p, idx) => (idx === i ? e.target.value : p)))}
                  style={{
                    background: COLORS.panelAlt, border: `1px solid ${COLORS.hairline}`, borderRadius: 8,
                    color: COLORS.text, padding: "10px 12px", fontSize: 14, fontFamily: "'Inter', sans-serif",
                  }}
                />
              ))}
            </div>
          </Card>

          <Button onClick={startAssign} disabled={!valid} icon={ChevronRight}>
            역할 배정 시작
          </Button>
        </div>
      </div>
    );
  }

  // ---------- REVEAL ----------
  if (screen === "reveal") {
    const role = assignments[revealIndex];
    const meta = ROLE_META[role];
    const Icon = meta.icon;
    const teammates = role === "mafia"
      ? names.filter((_, i) => assignments[i] === "mafia" && i !== revealIndex)
      : [];

    return (
      <div style={outer}>
        <style>{FONTS}</style>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ color: COLORS.muted, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: 2 }}>
              {revealIndex + 1} / {playerCount}
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: 24, marginTop: 4 }}>
              {names[revealIndex]}
            </div>
            <div style={{ color: COLORS.muted, fontSize: 13, marginTop: 4 }}>
              화면을 길게 눌러 신분을 확인하세요
            </div>
          </div>

          <div
            onMouseDown={() => { setHeld(true); setHasRevealed(true); }}
            onMouseUp={() => setHeld(false)}
            onMouseLeave={() => setHeld(false)}
            onTouchStart={() => { setHeld(true); setHasRevealed(true); }}
            onTouchEnd={() => setHeld(false)}
            style={{
              position: "relative", height: 360, borderRadius: 20, overflow: "hidden",
              border: `1px solid ${COLORS.hairline}`, cursor: "pointer", userSelect: "none",
              background: COLORS.panel, marginBottom: 20,
            }}
          >
            {/* Hidden state */}
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 14,
              opacity: held ? 0 : 1, transition: "opacity 0.25s ease",
              background: `repeating-linear-gradient(135deg, ${COLORS.panelAlt}, ${COLORS.panelAlt} 10px, ${COLORS.panel} 10px, ${COLORS.panel} 20px)`,
            }}>
              <Fingerprint size={44} color={COLORS.muted} />
              <div style={{ fontFamily: "'JetBrains Mono', monospace", color: COLORS.muted, fontSize: 13, letterSpacing: 3 }}>
                신원 미확인
              </div>
            </div>

            {/* Revealed state */}
            <div style={{
              position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", padding: 24,
              opacity: held ? 1 : 0, transition: "opacity 0.25s ease",
              background: `linear-gradient(180deg, ${meta.dim}, ${COLORS.panel})`,
            }}>
              <Stamp text="기밀" color={meta.color} />
              <Icon size={54} color={meta.color} style={{ marginBottom: 14 }} />
              <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 32, color: meta.color }}>
                {meta.label}
              </div>
              <div style={{ fontSize: 12, color: COLORS.muted, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2, marginTop: 2 }}>
                {meta.team}
              </div>
              <div style={{ textAlign: "center", fontSize: 13.5, color: COLORS.text, marginTop: 16, lineHeight: 1.6, opacity: 0.9 }}>
                {meta.desc}
              </div>
              {teammates.length > 0 && (
                <div style={{ marginTop: 14, fontSize: 13, color: meta.color, fontFamily: "'JetBrains Mono', monospace", textAlign: "center" }}>
                  동료: {teammates.join(", ")}
                </div>
              )}
            </div>
          </div>

          <Button onClick={nextReveal} disabled={!hasRevealed} icon={ChevronRight}>
            {revealIndex < playerCount - 1 ? "확인 완료 · 다음 사람에게 전달" : "확인 완료 · 마지막입니다"}
          </Button>
        </div>
      </div>
    );
  }

  // ---------- HANDOFF ----------
  if (screen === "handoff") {
    return (
      <div style={{ ...outer, justifyContent: "center" }}>
        <style>{FONTS}</style>
        <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
          <Sun size={40} color={COLORS.police} style={{ marginBottom: 16 }} />
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 26, marginBottom: 8 }}>
            모든 신원 확인 완료
          </div>
          <div style={{ color: COLORS.muted, fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
            휴대폰을 진행자에게 돌려주세요.<br />이제부터 진행자 화면으로 게임을 안내합니다.
          </div>
          <Button onClick={() => { setScreen("moderate"); setPhase("night"); setNightStepIdx(0); setRound(1); }} icon={Moon}>
            첫 번째 밤 시작하기
          </Button>
          <div style={{ marginTop: 12 }}>
            <Button variant="ghost" onClick={() => { setScreen("setup"); }} icon={RotateCcw}>
              처음부터 다시 설정
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- MODERATE ----------
  const compTags = [
    { label: "마피아", n: roleCounts.mafia, color: COLORS.mafia },
    { label: "경찰", n: roleCounts.police, color: COLORS.police },
    { label: "의사", n: roleCounts.doctor, color: COLORS.doctor },
    { label: "시민", n: citizenCount, color: COLORS.citizen },
  ].filter((t) => t.n > 0);

  return (
    <div style={{ ...outer, justifyContent: "center" }}>
      <style>{FONTS}</style>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
          {compTags.map((t) => (
            <span key={t.label} style={{
              fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: t.color,
              border: `1px solid ${t.color}55`, borderRadius: 20, padding: "4px 10px",
            }}>
              {t.label} {t.n}
            </span>
          ))}
        </div>

        <div style={{ textAlign: "center", color: COLORS.muted, fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: 3, marginBottom: 6 }}>
          ROUND {round}
        </div>

        {phase === "night" && (
          <Card style={{ padding: 28, textAlign: "center" }}>
            {(() => {
              const step = nightSteps[nightStepIdx];
              const Icon = step.icon;
              return (
                <>
                  <Icon size={42} color={step.color} style={{ marginBottom: 16 }} />
                  <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 24, marginBottom: 8 }}>
                    {step.text}
                  </div>
                  {step.sub && <div style={{ color: COLORS.muted, fontSize: 14 }}>{step.sub}</div>}
                  <div style={{ height: 1, background: COLORS.hairline, margin: "24px 0" }} />
                  <Button onClick={advanceNight} icon={ChevronRight}>
                    {nightStepIdx < nightSteps.length - 1 ? "다음 단계" : "낮으로 전환"}
                  </Button>
                </>
              );
            })()}
          </Card>
        )}

        {phase === "day" && (
          <Card style={{ padding: 28, textAlign: "center" }}>
            <Sun size={42} color={COLORS.police} style={{ marginBottom: 16 }} />
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 24, marginBottom: 8 }}>
              자유 토론 시간
            </div>
            <div style={{ color: COLORS.muted, fontSize: 14, marginBottom: 20 }}>
              밤사이 있었던 일을 발표하고 마피아를 추리하세요.
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 48, fontWeight: 700, color: seconds <= 10 && seconds > 0 ? COLORS.mafia : COLORS.text, marginBottom: 18 }}>
              {fmt(seconds)}
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <Button variant="ghost" onClick={() => setTimerActive((a) => !a)}>
                {timerActive ? "일시정지" : seconds === 0 ? "3분 재설정" : "시작"}
              </Button>
              <Button variant="ghost" onClick={() => { setSeconds(180); setTimerActive(false); }}>
                <RotateCcw size={16} />
              </Button>
            </div>
            <Button onClick={startVote} icon={Vote}>투표 시간으로</Button>
          </Card>
        )}

        {phase === "vote" && (
          <Card style={{ padding: 28, textAlign: "center" }}>
            <Vote size={42} color={COLORS.mafia} style={{ marginBottom: 16 }} />
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: 24, marginBottom: 8 }}>
              투표 시간
            </div>
            <div style={{ color: COLORS.muted, fontSize: 14, marginBottom: 20 }}>
              마피아로 의심되는 사람을 손으로 가리켜 투표하세요.
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 48, fontWeight: 700, color: seconds <= 10 && seconds > 0 ? COLORS.mafia : COLORS.text, marginBottom: 18 }}>
              {fmt(seconds)}
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <Button variant="ghost" onClick={() => setTimerActive((a) => !a)}>
                {timerActive ? "일시정지" : "시작"}
              </Button>
              <Button variant="ghost" onClick={() => { setSeconds(60); setTimerActive(false); }}>
                <RotateCcw size={16} />
              </Button>
            </div>
            <Button onClick={nextRound} variant="danger" icon={Moon}>
              처형 완료 · 다음 밤으로
            </Button>
          </Card>
        )}

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Button variant="ghost" onClick={() => setScreen("setup")} icon={RotateCcw}>
            새 게임 시작
          </Button>
        </div>
      </div>
    </div>
  );
}
