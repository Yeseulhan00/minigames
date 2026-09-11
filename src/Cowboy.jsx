import React, { useState, useRef, useEffect } from "react";
import { RotateCw, Crosshair, Shield, Repeat } from "lucide-react";

const INK = "#2E1A12";
const BONE = "#FFF4E2";

const ACTIONS = {
  reload: { label: "장전", color: "#D9A536", text: INK, Icon: RotateCw, desc: "총알 +1" },
  fire: { label: "발사", color: "#C4532E", text: BONE, Icon: Crosshair, desc: "총알 −1" },
  defend: { label: "방어", color: "#4F7A45", text: BONE, Icon: Shield, desc: "총알을 막음" },
  reflect: { label: "반사", color: "#1F6F74", text: BONE, Icon: Repeat, desc: "총알을 되돌림" },
};
const ORDER = ["reload", "fire", "defend", "reflect"];
const MAX_STREAK = { defend: 2, reflect: 2 };

const fresh = () => ({ bullets: 0, last: null, streak: 0 });

function blockedReason(action, f) {
  if (action === "fire" && f.bullets < 1) return "장전부터 하세요";
  const max = MAX_STREAK[action];
  if (max && f.last === action && f.streak >= max) return `${max}번 연속 사용함`;
  return null;
}

function applyAction(f, a) {
  return {
    bullets: f.bullets + (a === "reload" ? 1 : 0) - (a === "fire" ? 1 : 0),
    last: a,
    streak: f.last === a ? f.streak + 1 : 1,
  };
}

function resolve(p, c) {
  if (p === "fire" && c === "fire") return { winner: null, text: "총알끼리 부딪혀 무효!" };
  if (p === "fire") {
    if (c === "reload") return { winner: "player", text: "장전하던 컴퓨터를 명중!" };
    if (c === "defend") return { winner: null, text: "컴퓨터가 막아냈다" };
    if (c === "reflect") return { winner: "cpu", text: "총알이 튕겨서 나에게!" };
  }
  if (c === "fire") {
    if (p === "reload") return { winner: "cpu", text: "장전하다가 맞았다!" };
    if (p === "defend") return { winner: null, text: "막아냈다" };
    if (p === "reflect") return { winner: "player", text: "반사 성공! 컴퓨터 명중" };
  }
  return { winner: null, text: "아무 일도 없었다" };
}

function cpuChoose(cpu, me) {
  const w =
    me.bullets === 0
      ? { reload: 5, fire: 4, defend: 0.5, reflect: 0.5 }
      : { reload: 2.5, fire: 2, defend: 3, reflect: 2.5 };
  const legal = ORDER.filter((a) => !blockedReason(a, cpu));
  const total = legal.reduce((s, a) => s + w[a], 0);
  let r = Math.random() * total;
  for (const a of legal) {
    r -= w[a];
    if (r <= 0) return a;
  }
  return legal[0];
}

function Bullets({ n }) {
  return (
    <div className="bullets" aria-label={`총알 ${n}발`}>
      {n === 0 ? (
        <span className="no-ammo">총알 없음</span>
      ) : (
        <>
          {Array.from({ length: Math.min(n, 6) }).map((_, i) => (
            <span key={i} className="shell" />
          ))}
          {n > 6 && <span className="more">+{n - 6}</span>}
        </>
      )}
    </div>
  );
}

function Fighter({ name, f, action, hidden, lost }) {
  const a = action ? ACTIONS[action] : null;
  return (
    <div className="fighter">
      <div className="bubble-slot">
        {hidden ? (
          <span className="bubble wait">?</span>
        ) : a ? (
          <span className="bubble pop" style={{ background: a.color, color: a.text }}>
            <a.Icon size={15} strokeWidth={2.5} /> {a.label}
          </span>
        ) : null}
      </div>
      <div className={lost ? "cowboy down" : "cowboy"} aria-hidden="true">🤠</div>
      <div className="name">{name}</div>
      <Bullets n={f.bullets} />
    </div>
  );
}

function Cowboy() {
  const [me, setMe] = useState(fresh);
  const [cpu, setCpu] = useState(fresh);
  const [round, setRound] = useState(1);
  const [reveal, setReveal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [winner, setWinner] = useState(null);
  const [score, setScore] = useState({ me: 0, cpu: 0 });
  const [log, setLog] = useState([]);
  const [showRules, setShowRules] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  function play(a) {
    if (busy || winner || blockedReason(a, me)) return;
    const c = cpuChoose(cpu, me);
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setBusy(true);
    setReveal(null);
    timer.current = setTimeout(() => {
      const r = resolve(a, c);
      setMe(applyAction(me, a));
      setCpu(applyAction(cpu, c));
      setReveal({ p: a, c, ...r });
      setLog((l) => [{ round, p: a, c, text: r.text }, ...l].slice(0, 10));
      setRound((n) => n + 1);
      if (r.winner) {
        setWinner(r.winner);
        setScore((s) => (r.winner === "player" ? { ...s, me: s.me + 1 } : { ...s, cpu: s.cpu + 1 }));
      }
      setBusy(false);
    }, reduce ? 150 : 800);
  }

  function restart() {
    setMe(fresh());
    setCpu(fresh());
    setRound(1);
    setReveal(null);
    setWinner(null);
    setLog([]);
  }

  const headline = busy
    ? "하나, 둘, 셋!"
    : winner
    ? winner === "player"
      ? "내가 이겼다!"
      : "컴퓨터가 이겼다"
    : reveal
    ? reveal.text
    : "무엇을 낼까요?";

  return (
    <div className="wrap">
      <style>{css}</style>

      <a className="back-home" href="../index.html">← 목록으로</a>

      <header className="top">
        <h1>카우보이</h1>
        <div className="score" aria-label="전적">
          <span>나 <b>{score.me}</b></span>
          <span className="colon">:</span>
          <span><b>{score.cpu}</b> 컴퓨터</span>
        </div>
      </header>

      <section className="stage">
        <div className="round">{round}번째 대결</div>
        <div className="duel">
          <Fighter name="나" f={me} action={reveal?.p} hidden={busy} lost={winner === "cpu"} />
          <Fighter name="컴퓨터" f={cpu} action={reveal?.c} hidden={busy} lost={winner === "player"} />
        </div>
        <p className={busy ? "headline pulse" : "headline"} aria-live="polite">
          {headline}
        </p>
      </section>

      {winner ? (
        <button className="again" onClick={restart}>다시 대결</button>
      ) : (
        <div className="actions">
          {ORDER.map((key) => {
            const a = ACTIONS[key];
            const why = blockedReason(key, me);
            return (
              <button
                key={key}
                className="act"
                onClick={() => play(key)}
                disabled={!!why || busy}
                style={{ background: a.color, color: a.text }}
              >
                <a.Icon size={22} strokeWidth={2.5} />
                <span className="act-label">{a.label}</span>
                <span className="act-sub">{why || a.desc}</span>
              </button>
            );
          })}
        </div>
      )}

      <button className="rules-toggle" onClick={() => setShowRules((v) => !v)} aria-expanded={showRules}>
        {showRules ? "규칙 닫기" : "규칙 보기"}
      </button>
      {showRules && (
        <div className="rules">
          <p>매 판 나와 컴퓨터가 동시에 네 가지 행동 중 하나를 냅니다. 먼저 총에 맞는 쪽이 집니다.</p>
          <p><b>장전</b>은 총알을 한 발 채웁니다. <b>발사</b>는 총알이 있어야만 할 수 있어요.</p>
          <p><b>방어</b>는 총알을 막고, <b>반사</b>는 총알을 쏜 사람에게 되돌려 보냅니다. 둘 다 같은 행동을 연속 두 번까지만 낼 수 있어요.</p>
          <p>장전하는 사람을 쏘면 명중, 둘 다 쏘면 총알끼리 부딪혀 무효입니다.</p>
        </div>
      )}

      {log.length > 0 && (
        <section className="log">
          <h2>기록</h2>
          <ol>
            {log.map((e) => (
              <li key={e.round}>
                <span className="log-n">{e.round}</span>
                <span className="chip" style={{ background: ACTIONS[e.p].color, color: ACTIONS[e.p].text }}>
                  {ACTIONS[e.p].label}
                </span>
                <span className="chip" style={{ background: ACTIONS[e.c].color, color: ACTIONS[e.c].text }}>
                  {ACTIONS[e.c].label}
                </span>
                <span className="log-t">{e.text}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Gowun+Dodum&display=swap');
.wrap { min-height: 100vh; background: #EBC48E; color: ${INK}; font-family: 'Gowun Dodum', sans-serif;
  padding: 20px 16px 40px; max-width: 480px; margin: 0 auto; box-sizing: border-box; }
.back-home { display: inline-block; margin-bottom: 10px; font-size: 15px; color: ${INK};
  text-decoration: none; opacity: .75; }
.back-home:hover { opacity: 1; text-decoration: underline; text-underline-offset: 3px; }
.top { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 14px; }
h1 { font-family: 'Black Han Sans', sans-serif; font-size: 40px; line-height: 1; margin: 0; letter-spacing: 1px; }
.score { font-size: 15px; display: flex; gap: 6px; align-items: baseline; }
.score b { font-family: 'Black Han Sans', sans-serif; font-size: 22px; font-weight: 400; }
.colon { opacity: .5; }
.stage { border: 3px solid ${INK}; border-radius: 20px; overflow: hidden; position: relative;
  background: linear-gradient(#9FD3D0 0 60%, #D99A5B 60% 100%); padding: 14px 10px 16px; }
.round { text-align: center; font-size: 13px; opacity: .7; }
.duel { display: flex; justify-content: space-between; margin-top: 4px; }
.fighter { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.bubble-slot { height: 38px; display: flex; align-items: center; }
.bubble { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 999px;
  border: 2px solid ${INK}; font-family: 'Black Han Sans', sans-serif; font-size: 16px; }
.bubble.wait { background: ${BONE}; min-width: 20px; justify-content: center; }
.bubble.pop { animation: pop .28s ease-out; }
.cowboy { font-size: 60px; line-height: 1.1; transition: transform .5s ease-in, opacity .5s; }
.cowboy.down { transform: rotate(-90deg) translateX(-14px); opacity: .55; }
.name { font-family: 'Black Han Sans', sans-serif; font-size: 18px; }
.bullets { display: flex; gap: 4px; align-items: center; min-height: 18px; }
.shell { width: 9px; height: 16px; border-radius: 5px 5px 2px 2px; background: #D9A536; border: 1.5px solid ${INK}; }
.more { font-size: 13px; margin-left: 2px; }
.no-ammo { font-size: 13px; opacity: .75; }
.headline { text-align: center; font-family: 'Black Han Sans', sans-serif; font-size: 24px; margin: 14px 0 0; min-height: 30px; }
.headline.pulse { animation: pulse .8s ease-in-out; }
.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
.act { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 14px;
  border: 3px solid ${INK}; border-radius: 16px; cursor: pointer; text-align: left; font-family: inherit;
  transition: transform .08s; box-shadow: 0 4px 0 ${INK}; }
.act:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 1px 0 ${INK}; }
.act:disabled { opacity: .38; cursor: not-allowed; box-shadow: none; }
.act-label { font-family: 'Black Han Sans', sans-serif; font-size: 24px; line-height: 1.15; }
.act-sub { font-size: 13px; }
button:focus-visible { outline: 3px solid ${INK}; outline-offset: 3px; }
.again { width: 100%; margin-top: 16px; padding: 16px; font-family: 'Black Han Sans', sans-serif; font-size: 24px;
  background: ${INK}; color: ${BONE}; border: none; border-radius: 16px; cursor: pointer; }
.rules-toggle { margin-top: 18px; background: none; border: none; padding: 4px 0; font-family: inherit;
  font-size: 15px; color: ${INK}; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.rules { background: ${BONE}; border: 2px solid ${INK}; border-radius: 14px; padding: 4px 14px; margin-top: 8px;
  font-size: 15px; line-height: 1.6; }
.log { margin-top: 20px; }
.log h2 { font-family: 'Black Han Sans', sans-serif; font-size: 18px; font-weight: 400; margin: 0 0 8px; }
.log ol { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.log li { display: flex; align-items: center; gap: 6px; font-size: 14px; }
.log-n { width: 22px; opacity: .6; text-align: right; }
.chip { padding: 2px 8px; border-radius: 999px; font-size: 13px; border: 1.5px solid ${INK}; }
.log-t { flex: 1; }
@keyframes pop { from { transform: scale(.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
@media (prefers-reduced-motion: reduce) {
  .bubble.pop, .headline.pulse { animation: none; }
  .cowboy { transition: none; }
}
`;

export default Cowboy;
