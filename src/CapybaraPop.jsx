import React, { useState, useCallback, useRef } from "react";

const SIZE = 8;
const TARGET_SCORE = 1500;
const START_MOVES = 25;

const TYPES = [
  { fur: "#A9764F", head: "#BF8C63", accessory: "🍊", name: "귤카피" },
  { fur: "#8C8C82", head: "#A3A399", accessory: "🍃", name: "잎카피" },
  { fur: "#D9A441", head: "#E6BC66", accessory: "🌸", name: "꽃카피" },
  { fur: "#5C3D28", head: "#734D33", accessory: "🍎", name: "사과카피" },
  { fur: "#E8D5B5", head: "#F2E6CC", accessory: "⭐", name: "별카피" },
];

let idCounter = 1;
const nextId = () => idCounter++;
const randType = () => Math.floor(Math.random() * TYPES.length);
const makeTile = () => ({ id: nextId(), type: randType() });
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

function findMatches(board) {
  const matched = new Set();
  // rows
  for (let r = 0; r < SIZE; r++) {
    let runStart = 0;
    for (let c = 1; c <= SIZE; c++) {
      const cur = c < SIZE ? board[r][c] : null;
      const prev = board[r][c - 1];
      if (!cur || !prev || cur.type !== prev.type) {
        if (c - runStart >= 3) {
          for (let k = runStart; k < c; k++) matched.add(`${r},${k}`);
        }
        runStart = c;
      }
    }
  }
  // cols
  for (let c = 0; c < SIZE; c++) {
    let runStart = 0;
    for (let r = 1; r <= SIZE; r++) {
      const cur = r < SIZE ? board[r][c] : null;
      const prev = board[r - 1][c];
      if (!cur || !prev || cur.type !== prev.type) {
        if (r - runStart >= 3) {
          for (let k = runStart; k < r; k++) matched.add(`${k},${c}`);
        }
        runStart = r;
      }
    }
  }
  return matched;
}

function generateInitialBoard() {
  let board = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => makeTile())
  );
  let guard = 0;
  let matches = findMatches(board);
  while (matches.size > 0 && guard < 200) {
    matches.forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      board[r][c] = makeTile();
    });
    matches = findMatches(board);
    guard++;
  }
  return board;
}

function collapseAndRefill(board, matchedKeys) {
  const nb = cloneBoard(board);
  matchedKeys.forEach((key) => {
    const [r, c] = key.split(",").map(Number);
    nb[r][c] = null;
  });
  for (let c = 0; c < SIZE; c++) {
    const colTiles = [];
    for (let r = 0; r < SIZE; r++) {
      if (nb[r][c]) colTiles.push(nb[r][c]);
    }
    const missing = SIZE - colTiles.length;
    const newTiles = Array.from({ length: missing }, () => makeTile());
    const fullCol = [...newTiles, ...colTiles];
    for (let r = 0; r < SIZE; r++) {
      nb[r][c] = fullCol[r];
    }
  }
  return nb;
}

function Capybara({ type, popping }) {
  const t = TYPES[type];
  return (
    <div className={`capy ${popping ? "capy-pop" : ""}`}>
      <div className="capy-ear capy-ear-l" style={{ background: t.head }} />
      <div className="capy-ear capy-ear-r" style={{ background: t.head }} />
      <div className="capy-head" style={{ background: t.head }}>
        <div className="capy-eye capy-eye-l" />
        <div className="capy-eye capy-eye-r" />
        <div className="capy-nose" />
        <div className="capy-accessory">{t.accessory}</div>
      </div>
      <div className="capy-body" style={{ background: t.fur }} />
    </div>
  );
}

export default function CapybaraPop() {
  const [board, setBoard] = useState(() => generateInitialBoard());
  const [selected, setSelected] = useState(null);
  const [popping, setPopping] = useState(new Set());
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(START_MOVES);
  const [animating, setAnimating] = useState(false);
  const [status, setStatus] = useState("playing"); // playing | won | lost
  const [combo, setCombo] = useState(0);
  const boardRef = useRef(board);
  boardRef.current = board;

  const resolveBoard = useCallback(async (startBoard) => {
    let current = startBoard;
    let matches = findMatches(current);
    let comboCount = 0;
    let gained = 0;
    while (matches.size > 0) {
      comboCount++;
      setCombo(comboCount);
      setPopping(new Set(matches));
      await delay(320);
      gained += matches.size * 10 * comboCount;
      current = collapseAndRefill(current, matches);
      setBoard(current);
      setPopping(new Set());
      await delay(260);
      matches = findMatches(current);
    }
    setCombo(0);
    return { finalBoard: current, gained };
  }, []);

  const trySwap = useCallback(
    async (a, b) => {
      if (animating || status !== "playing") return;
      setAnimating(true);
      let current = cloneBoard(boardRef.current);
      const tmp = current[a.r][a.c];
      current[a.r][a.c] = current[b.r][b.c];
      current[b.r][b.c] = tmp;
      setBoard(current);
      await delay(160);

      const matches = findMatches(current);
      if (matches.size === 0) {
        await delay(120);
        const back = cloneBoard(current);
        const t2 = back[a.r][a.c];
        back[a.r][a.c] = back[b.r][b.c];
        back[b.r][b.c] = t2;
        setBoard(back);
        await delay(160);
        setAnimating(false);
        return;
      }

      const movesLeft = moves - 1;
      setMoves(movesLeft);
      const { gained } = await resolveBoard(current);
      setAnimating(false);

      setScore((s) => {
        const newScore = s + gained;
        if (newScore >= TARGET_SCORE) setStatus("won");
        else if (movesLeft <= 0) setStatus("lost");
        return newScore;
      });
    },
    [animating, moves, status, resolveBoard]
  );

  const handleClick = (r, c) => {
    if (animating || status !== "playing") return;
    if (!selected) {
      setSelected({ r, c });
      return;
    }
    if (selected.r === r && selected.c === c) {
      setSelected(null);
      return;
    }
    const isAdjacent =
      Math.abs(selected.r - r) + Math.abs(selected.c - c) === 1;
    if (!isAdjacent) {
      setSelected({ r, c });
      return;
    }
    const a = selected;
    setSelected(null);
    trySwap(a, { r, c });
  };

  const resetGame = () => {
    idCounter = 1;
    setBoard(generateInitialBoard());
    setSelected(null);
    setPopping(new Set());
    setScore(0);
    setMoves(START_MOVES);
    setStatus("playing");
    setCombo(0);
  };

  const progressPct = Math.min(100, (score / TARGET_SCORE) * 100);

  return (
    <div className="wrap">
      <style>{`
        * { box-sizing: border-box; }
        .wrap {
          min-height: 100%;
          background: radial-gradient(ellipse at top, #2c4a47 0%, #16302e 55%, #0f2422 100%);
          font-family: 'Trebuchet MS', 'Apple SD Gothic Neo', sans-serif;
          color: #f0e6d2;
          padding: 18px 12px 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          overflow: hidden;
        }
        .steam {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          filter: blur(2px);
          animation: rise 9s linear infinite;
        }
        @keyframes rise {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          15% { opacity: 0.5; }
          100% { transform: translateY(-320px) scale(1.4); opacity: 0; }
        }
        .header { text-align: center; margin-bottom: 10px; z-index: 1; }
        .title {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #f5ead2;
          text-shadow: 0 2px 0 rgba(0,0,0,0.25);
          margin: 0;
        }
        .subtitle {
          font-size: 12px;
          color: #cbb98f;
          margin-top: 2px;
          letter-spacing: 2px;
        }
        .hud {
          display: flex;
          gap: 10px;
          margin: 12px 0 10px;
          z-index: 1;
          width: 100%;
          max-width: 420px;
        }
        .hud-card {
          flex: 1;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(240,230,210,0.15);
          border-radius: 12px;
          padding: 8px 10px;
          text-align: center;
        }
        .hud-label {
          font-size: 10px;
          color: #b7cfc5;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .hud-value {
          font-size: 18px;
          font-weight: 700;
          color: #fff6e6;
        }
        .progress-outer {
          width: 100%;
          max-width: 420px;
          height: 8px;
          background: rgba(255,255,255,0.08);
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 14px;
          z-index: 1;
        }
        .progress-inner {
          height: 100%;
          background: linear-gradient(90deg, #e8825a, #f2b45c);
          transition: width 0.4s ease;
        }
        .board {
          display: grid;
          grid-template-columns: repeat(8, 1fr);
          gap: 4px;
          width: 100%;
          max-width: 420px;
          aspect-ratio: 1 / 1;
          background: linear-gradient(160deg, #3a6360, #23433f);
          border: 3px solid #6b4a2f;
          border-radius: 16px;
          padding: 6px;
          box-shadow: inset 0 0 24px rgba(0,0,0,0.35), 0 8px 20px rgba(0,0,0,0.35);
          z-index: 1;
        }
        .cell {
          position: relative;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.1s ease;
          touch-action: manipulation;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }
        .cell:active { transform: scale(0.94); }
        .capy, .capy * {
          pointer-events: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
        }
        .cell.selected {
          background: rgba(232,130,90,0.35);
          box-shadow: 0 0 0 2px #e8825a inset, 0 0 10px rgba(232,130,90,0.6);
        }
        .capy {
          position: relative;
          width: 82%;
          height: 82%;
        }
        .capy-pop {
          animation: pop 0.32s ease forwards;
        }
        @keyframes pop {
          0% { transform: scale(1) rotate(0deg); opacity: 1; }
          60% { transform: scale(1.25) rotate(8deg); opacity: 0.8; }
          100% { transform: scale(0) rotate(20deg); opacity: 0; }
        }
        .capy-body {
          position: absolute;
          bottom: 4%;
          left: 12%;
          width: 76%;
          height: 52%;
          border-radius: 50%;
        }
        .capy-head {
          position: absolute;
          top: 2%;
          left: 22%;
          width: 56%;
          height: 46%;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15) inset;
        }
        .capy-ear {
          position: absolute;
          top: -2%;
          width: 16%;
          height: 16%;
          border-radius: 50%;
        }
        .capy-ear-l { left: 22%; }
        .capy-ear-r { right: 22%; }
        .capy-eye {
          position: absolute;
          top: 42%;
          width: 9%;
          height: 9%;
          border-radius: 50%;
          background: #2b1c12;
        }
        .capy-eye-l { left: 26%; }
        .capy-eye-r { right: 26%; }
        .capy-nose {
          position: absolute;
          bottom: 14%;
          left: 40%;
          width: 20%;
          height: 12%;
          border-radius: 50%;
          background: #2b1c12;
          opacity: 0.75;
        }
        .capy-accessory {
          position: absolute;
          top: -32%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 13px;
        }
        .combo-badge {
          position: absolute;
          top: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: #e8825a;
          color: #1f1208;
          font-weight: 800;
          font-size: 13px;
          padding: 4px 12px;
          border-radius: 999px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          z-index: 2;
          animation: comboPop 0.3s ease;
        }
        @keyframes comboPop {
          0% { transform: translateX(-50%) scale(0.5); opacity: 0; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(10,20,18,0.82);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        .modal {
          background: linear-gradient(160deg, #3a6360, #1c3532);
          border: 1px solid rgba(240,230,210,0.2);
          border-radius: 18px;
          padding: 26px 24px;
          text-align: center;
          width: 260px;
        }
        .modal-emoji { font-size: 40px; margin-bottom: 6px; }
        .modal-title { font-size: 19px; font-weight: 800; margin: 4px 0 2px; }
        .modal-sub { font-size: 13px; color: #cbb98f; margin-bottom: 16px; }
        .modal-btn {
          background: #e8825a;
          color: #1f1208;
          border: none;
          padding: 10px 22px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
        }
      `}</style>

      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="steam"
          style={{
            width: 40 + (i % 3) * 20,
            height: 40 + (i % 3) * 20,
            left: `${10 + i * 15}%`,
            bottom: -20,
            animationDelay: `${i * 1.4}s`,
          }}
        />
      ))}

      <div className="header">
        <p className="title">🦫 카피바라 온천 팡팡</p>
        <p className="subtitle">CAPYBARA ONSEN POP</p>
      </div>

      <div className="hud">
        <div className="hud-card">
          <div className="hud-label">점수</div>
          <div className="hud-value">{score}</div>
        </div>
        <div className="hud-card">
          <div className="hud-label">목표</div>
          <div className="hud-value">{TARGET_SCORE}</div>
        </div>
        <div className="hud-card">
          <div className="hud-label">남은 횟수</div>
          <div className="hud-value">{moves}</div>
        </div>
      </div>

      <div className="progress-outer">
        <div className="progress-inner" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="board" style={{ position: "relative" }}>
        {combo > 1 && <div className="combo-badge">COMBO x{combo}</div>}
        {board.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r},${c}`;
            const isSelected = selected && selected.r === r && selected.c === c;
            const isPopping = popping.has(key);
            return (
              <div
                key={cell ? cell.id : key}
                className={`cell ${isSelected ? "selected" : ""}`}
                onClick={() => handleClick(r, c)}
              >
                {cell && <Capybara type={cell.type} popping={isPopping} />}
              </div>
            );
          })
        )}
      </div>

      {status !== "playing" && (
        <div className="overlay">
          <div className="modal">
            <div className="modal-emoji">{status === "won" ? "🍊" : "💧"}</div>
            <div className="modal-title">
              {status === "won" ? "온천 완주!" : "횟수 종료"}
            </div>
            <div className="modal-sub">
              최종 점수 {score}점{status === "won" ? " · 목표 달성!" : " · 목표 미달성"}
            </div>
            <button className="modal-btn" onClick={resetGame}>
              다시 하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
