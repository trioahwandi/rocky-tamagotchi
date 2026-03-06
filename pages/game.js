import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config/contract";
import Link from "next/link";

const MAIN_COLOR = "#825A6D";
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 500;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 60;
const OBJECT_SIZE = 35;
const BOMB_SIZE = 20;
const ROCK_SIZE = 40;

export default function Game() {
  const canvasRef = useRef(null);
  const gameRef = useRef({
    running: false,
    player: { x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, y: CANVAS_HEIGHT - 80 },
    objects: [],
    score: 0,
    lives: 3,
    speed: 2,
    frame: 0,
    keys: {},
    animFrame: null,
  });

  const [gameState, setGameState] = useState("idle"); // idle, playing, gameover
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState("");
  const rockyImg = useRef(null);
  const rockImg = useRef(null);

useEffect(() => {
    const img = new Image();
    img.src = "/rocky.png";
    rockyImg.current = img;

    const rImg = new Image();
    rImg.src = "/rock.png";
    rockImg.current = rImg;
  }, []);
  useEffect(() => {
    const handleKey = (e) => {
      gameRef.current.keys[e.key] = e.type === "keydown";
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKey);
    };
  }, []);

  function spawnObject(frame, speed) {
    if (frame % Math.max(40 - Math.floor(speed * 3), 15) === 0) {
      const isBomb = Math.random() < 0.3;
      return {
        x: Math.random() * (CANVAS_WIDTH - OBJECT_SIZE),
        y: -OBJECT_SIZE,
        type: isBomb ? "bomb" : "rock",
      };
    }
    return null;
  }

  function startGame() {
    const g = gameRef.current;
    g.running = true;
    g.player = { x: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2, y: CANVAS_HEIGHT - 80 };
    g.objects = [];
    g.score = 0;
    g.lives = 3;
    g.speed = 2;
    g.frame = 0;
    setScore(0);
    setLives(3);
    setGameState("playing");
    requestAnimationFrame(gameLoop);
  }

  function gameLoop() {
    const g = gameRef.current;
    if (!g.running) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    g.frame++;
    g.speed = 2 + g.frame / 300;

    // Move player
    if (g.keys["ArrowLeft"] || g.keys["a"]) g.player.x = Math.max(0, g.player.x - 5);
    if (g.keys["ArrowRight"] || g.keys["d"]) g.player.x = Math.min(CANVAS_WIDTH - PLAYER_WIDTH, g.player.x + 5);

    // Spawn objects
    const newObj = spawnObject(g.frame, g.speed);
    if (newObj) g.objects.push(newObj);

    // Move objects
    g.objects = g.objects.filter((o) => o.y < CANVAS_HEIGHT + OBJECT_SIZE);
    g.objects.forEach((o) => (o.y += g.speed));

    // Collision
    g.objects = g.objects.filter((o) => {
      const hit =
        o.x < g.player.x + PLAYER_WIDTH &&
        o.x + OBJECT_SIZE > g.player.x &&
        o.y < g.player.y + PLAYER_HEIGHT &&
        o.y + OBJECT_SIZE > g.player.y;

      if (hit) {
        if (o.type === "rock") {
          g.score += 10;
          setScore(g.score);
        } else {
          g.lives -= 1;
          setLives(g.lives);
          if (g.lives <= 0) {
            g.running = false;
            setGameState("gameover");
            return false;
          }
        }
        return false;
      }
      return true;
    });

    // Draw
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Background
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid lines
    ctx.strokeStyle = "rgba(130,90,109,0.1)";
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
    }

// Draw objects
    g.objects.forEach((o) => {
      if (o.type === "rock") {
        if (rockImg.current?.complete) {
          ctx.shadowColor = "#825A6D";
          ctx.shadowBlur = 8;
          ctx.drawImage(rockImg.current, o.x, o.y, OBJECT_SIZE, ROCK_SIZE);
          ctx.shadowBlur = 0;
        } else {
          ctx.font = `${OBJECT_SIZE}px serif`;
          ctx.fillText("🪨", o.x, o.y + OBJECT_SIZE);
        }
      } else {
        // Glow merah untuk bom
        ctx.shadowColor = "#ff5555";
        ctx.shadowBlur = 8;
        ctx.font = `${OBJECT_SIZE}px serif`;
        ctx.fillText("💣", o.x, o.y + OBJECT_SIZE);
        ctx.shadowBlur = 0;
      }
    });
    // Draw player (Rocky)
    if (rockyImg.current?.complete) {
      ctx.drawImage(rockyImg.current, g.player.x, g.player.y, PLAYER_WIDTH, PLAYER_HEIGHT);
    } else {
      ctx.font = "40px serif";
      ctx.fillText("🪨", g.player.x, g.player.y + PLAYER_HEIGHT);
    }

    // Glow under player
    ctx.shadowColor = MAIN_COLOR;
    ctx.shadowBlur = 20;
    ctx.strokeStyle = MAIN_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(g.player.x + PLAYER_WIDTH / 2, g.player.y + PLAYER_HEIGHT - 5, PLAYER_WIDTH / 2, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    g.animFrame = requestAnimationFrame(gameLoop);
  }

  // Move player with buttons
  const moveInterval = useRef(null);
  function startMove(dir) {
    moveInterval.current = setInterval(() => {
      const g = gameRef.current;
      if (dir === "left") g.player.x = Math.max(0, g.player.x - 5);
      if (dir === "right") g.player.x = Math.min(CANVAS_WIDTH - PLAYER_WIDTH, g.player.x + 5);
    }, 16);
  }
  function stopMove() { clearInterval(moveInterval.current); }

  // Claim XP
  async function claimXP() {
    if (score === 0) { setMessage("Main dulu baru claim!"); return; }
    setClaiming(true);
    setMessage("");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const claimAmount = Math.floor(score / 10);
      // Pakai resonate sebagai proxy claim XP
      for (let i = 0; i < Math.min(claimAmount, 5); i++) {
        const tx = await contract.resonate();
        await tx.wait();
      }
      setMessage(`✨ ${claimAmount * 10} XP berhasil di-claim ke Rocky!`);
    } catch (err) {
      setMessage("Error: " + (err.reason || err.message));
    }
    setClaiming(false);
  }

  return (
    <main style={{ background: "#0a0a0f", minHeight: "100vh", color: "white", fontFamily: "sans-serif", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "30px" }}>

      {/* Header */}
      <h1 style={{ color: MAIN_COLOR, fontSize: "2rem", fontWeight: 900, letterSpacing: "0.3em", marginBottom: "4px" }}>
        ROCK DODGE
      </h1>
      <p style={{ color: "#666", fontSize: "0.75rem", letterSpacing: "0.15em", marginBottom: "16px" }}>
        Catch rocks 🪨 Avoid bombs 💣
      </p>

      {/* Stats Bar */}
      <div style={{ display: "flex", gap: "24px", marginBottom: "12px" }}>
        <span style={{ color: "#aaa", fontSize: "14px" }}>❤️ {lives}</span>
        <span style={{ color: MAIN_COLOR, fontSize: "14px", fontWeight: "bold" }}>Score: {score}</span>
      </div>

      {/* Canvas */}
      <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", border: `2px solid ${MAIN_COLOR}`, boxShadow: `0 0 30px rgba(130,90,109,0.4)` }}>
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />

        {/* Overlay: Idle */}
        {gameState === "idle" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
            <p style={{ color: "#aaa", fontSize: "13px", textAlign: "center", padding: "0 20px" }}>
              Tangkap 🪨 batu untuk dapat XP<br />Hindari 💣 bom atau nyawa berkurang!
            </p>
            <button onClick={startGame} style={{ background: MAIN_COLOR, color: "white", fontWeight: "bold", padding: "12px 32px", borderRadius: "999px", border: "none", cursor: "pointer", fontSize: "16px" }}>
              ▶ Start Game
            </button>
          </div>
        )}

        {/* Overlay: Game Over */}
        {gameState === "gameover" && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
            <h2 style={{ color: "#ff5555", fontSize: "1.5rem", fontWeight: 900 }}>GAME OVER</h2>
            <p style={{ color: "#aaa", fontSize: "14px" }}>Score: <span style={{ color: MAIN_COLOR, fontWeight: "bold" }}>{score}</span></p>
            <p style={{ color: "#aaa", fontSize: "13px" }}>XP yang bisa di-claim: <span style={{ color: "white", fontWeight: "bold" }}>{Math.floor(score / 10) * 10}</span></p>
            <button onClick={claimXP} disabled={claiming} style={{ background: MAIN_COLOR, color: "white", fontWeight: "bold", padding: "10px 28px", borderRadius: "999px", border: "none", cursor: "pointer" }}>
              {claiming ? "Claiming..." : "⚡ Claim XP ke Rocky"}
            </button>
            <button onClick={startGame} style={{ background: "transparent", color: "#aaa", fontWeight: "bold", padding: "8px 24px", borderRadius: "999px", border: "1px solid #444", cursor: "pointer" }}>
              🔄 Main Lagi
            </button>
            {message && <p style={{ color: "#825A6D", fontSize: "12px", textAlign: "center" }}>{message}</p>}
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div style={{ display: "flex", gap: "24px", marginTop: "16px" }}>
        <button
          onPointerDown={() => startMove("left")} onPointerUp={stopMove} onPointerLeave={stopMove}
          style={{ background: "rgba(130,90,109,0.2)", border: `1px solid ${MAIN_COLOR}`, color: "white", fontSize: "24px", padding: "12px 28px", borderRadius: "12px", cursor: "pointer" }}>
          ◀
        </button>
        <button
          onPointerDown={() => startMove("right")} onPointerUp={stopMove} onPointerLeave={stopMove}
          style={{ background: "rgba(130,90,109,0.2)", border: `1px solid ${MAIN_COLOR}`, color: "white", fontSize: "24px", padding: "12px 28px", borderRadius: "12px", cursor: "pointer" }}>
          ▶
        </button>
      </div>

      {/* Back to Rocky */}
      <Link href="/" style={{ color: "#666", fontSize: "12px", marginTop: "20px", textDecoration: "none", letterSpacing: "0.1em" }}>
        ← Back to Rocky
      </Link>

    </main>
  );
}