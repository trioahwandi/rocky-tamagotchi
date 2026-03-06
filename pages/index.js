import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, NETWORK } from "../config/contract";

const MAIN_COLOR = "#825A6D";
const MAIN_GLOW = "rgba(130, 90, 109, 0.6)";
const MAIN_DARK = "rgba(130, 90, 109, 0.15)";

export default function Home() {
  const [account, setAccount] = useState(null);
  const [rocky, setRocky] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState("success");

  async function connectWallet() {
    if (!window.ethereum) { alert("Install MetaMask dulu!"); return; }
    try {
      await window.ethereum.request({ method: "wallet_addEthereumChain", params: [NETWORK] });
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      showMessage("Wallet connected!", "success");
    } catch (err) { console.error(err); }
  }

  async function getContract() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  }

  async function loadRocky() {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const data = await contract.rockies(account);
      setRocky({
        energy:          Number(data[0]),
        stability:       Number(data[1]),
        resonance:       Number(data[2]),
        mood:            Number(data[3]),
        level:           Number(data[4]),
        xp:              Number(data[5]),
        lastCheckIn:     Number(data[7]),
        checkInStreak:   Number(data[8]),
        exists:          data[9],
        collapsed:       data[10],
      });
    } catch (err) { console.error(err); }
  }

  async function loadLeaderboard() {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const data = await contract.getLeaderboard();
      const sorted = [...data].map((e) => ({
        player: e.player, level: Number(e.level),
        xp: Number(e.xp), resonance: Number(e.resonance),
      })).sort((a, b) => b.level - a.level || b.xp - a.xp);
      setLeaderboard(sorted);
    } catch (err) { console.error(err); }
  }

  function showMessage(msg, type = "success") {
    setMessage(msg); setMsgType(type);
    setTimeout(() => setMessage(""), 4000);
  }

  async function doAction(action) {
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract[action]();
      showMessage("Transaksi dikirim...", "info");
      await tx.wait();
      showMessage(`${action.charAt(0).toUpperCase() + action.slice(1)} berhasil! ✨`, "success");
      await loadRocky();
      await loadLeaderboard();
    } catch (err) {
      showMessage("Error: " + (err.reason || err.message), "error");
    }
    setLoading(false);
  }

  async function createRocky() {
    setLoading(true);
    try {
      const contract = await getContract();
      const tx = await contract.createRocky();
      showMessage("Membuat Rocky...", "info");
      await tx.wait();
      showMessage("Rocky berhasil lahir! 🎉", "success");
      await loadRocky();
    } catch (err) {
      showMessage("Error: " + (err.reason || err.message), "error");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (account) { loadRocky(); loadLeaderboard(); }
  }, [account]);

  const statColors = {
    Energy:    "#f59e0b",
    Stability: "#60a5fa",
    Resonance: MAIN_COLOR,
    Mood:      "#f472b6",
  };

  return (
    <main style={{ background: "#0a0a0f", minHeight: "100vh", color: "white", fontFamily: "sans-serif" }}
      className="flex flex-col items-center py-10 px-4">

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 15px ${MAIN_GLOW}, 0 0 30px ${MAIN_GLOW}; }
          50% { box-shadow: 0 0 30px ${MAIN_GLOW}, 0 0 60px ${MAIN_GLOW}, 0 0 80px ${MAIN_GLOW}; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .rocky-float { animation: float 3s ease-in-out infinite; }
        .rocky-glow { animation: glow-pulse 2s ease-in-out infinite; }
        .fade-in { animation: fadeIn 0.4s ease; }
        .btn-action {
          background: ${MAIN_DARK};
          border: 1px solid ${MAIN_COLOR};
          color: white;
          font-weight: bold;
          padding: 12px 0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .btn-action:hover {
          background: ${MAIN_GLOW};
          box-shadow: 0 0 20px ${MAIN_GLOW};
          transform: translateY(-2px);
        }
        .btn-action:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }
        .stat-bar-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.8s ease;
        }
      `}</style>

      {/* Header */}
      <div className="text-center mb-8 fade-in">
        <h1 style={{ color: MAIN_COLOR, fontSize: "3rem", fontWeight: 900, letterSpacing: "0.3em", textShadow: `0 0 30px ${MAIN_GLOW}` }}>
          ROCKY
        </h1>
        <p style={{ color: "#888", fontSize: "0.8rem", letterSpacing: "0.2em" }}>
          SEISMIC GUARDIAN — ON-CHAIN TAMAGOTCHI
        </p>
        <a href="/game" style={{ color: MAIN_COLOR, fontSize: "12px", letterSpacing: "0.15em", textDecoration: "none", border: `1px solid ${MAIN_COLOR}`, padding: "6px 18px", borderRadius: "999px", marginTop: "8px", display: "inline-block" }}>
  🎮 Play Rock Dodge
</a>
      </div>

      {/* Connect Wallet */}
      {!account ? (
        <button onClick={connectWallet}
          style={{ background: MAIN_COLOR, color: "white", fontWeight: "bold", padding: "14px 40px", borderRadius: "999px", border: "none", cursor: "pointer", fontSize: "16px", boxShadow: `0 0 30px ${MAIN_GLOW}`, transition: "all 0.2s" }}
          onMouseOver={e => e.target.style.transform = "scale(1.05)"}
          onMouseOut={e => e.target.style.transform = "scale(1)"}
        >
          Connect Wallet
        </button>
      ) : (
        <p style={{ color: "#666", fontSize: "0.75rem", marginBottom: "8px", letterSpacing: "0.1em" }}>
          {account.slice(0, 6)}...{account.slice(-4)}
        </p>
      )}

      {account && (
        <>
          {!rocky?.exists ? (
            <button onClick={createRocky} disabled={loading}
              style={{ marginTop: "20px", background: MAIN_COLOR, color: "white", fontWeight: "bold", padding: "14px 40px", borderRadius: "999px", border: "none", cursor: "pointer", fontSize: "16px", boxShadow: `0 0 30px ${MAIN_GLOW}` }}>
              {loading ? "Loading..." : "✨ Create Rocky"}
            </button>
          ) : (
            <>
              {/* Rocky Display */}
              <div className="rocky-float" style={{ marginTop: "16px", marginBottom: "24px", position: "relative" }}>
                <div className="rocky-glow" style={{ width: "180px", height: "180px", borderRadius: "50%", background: MAIN_DARK, border: `3px solid ${MAIN_COLOR}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "80px" }}>
                  <img src="/rocky.PNG" alt="Rocky"
                    style={{ width: "130px", height: "130px", objectFit: "contain" }} />
                </div>
                <div style={{ position: "absolute", bottom: "-12px", left: "50%", transform: "translateX(-50%)", background: MAIN_COLOR, color: "white", fontSize: "11px", fontWeight: "bold", padding: "4px 14px", borderRadius: "999px", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
                  LVL {rocky.level}
                </div>
              </div>

              {/* Stats */}
              <div style={{ width: "100%", maxWidth: "420px", background: "#111118", borderRadius: "20px", padding: "24px", marginBottom: "16px", border: `1px solid ${MAIN_COLOR}22` }}>
                <p style={{ textAlign: "center", color: "#888", fontSize: "12px", marginBottom: "16px", letterSpacing: "0.1em" }}>
                  XP: {rocky.xp} / {rocky.level * 100}
                </p>
                {[
                  { label: "Energy",    value: rocky.energy },
                  { label: "Stability", value: rocky.stability },
                  { label: "Resonance", value: rocky.resonance },
                  { label: "Mood",      value: rocky.mood },
                ].map((stat) => (
                  <div key={stat.label} style={{ marginBottom: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px", color: "#aaa" }}>
                      <span style={{ letterSpacing: "0.1em" }}>{stat.label.toUpperCase()}</span>
                      <span style={{ color: statColors[stat.label] }}>{stat.value}/100</span>
                    </div>
                    <div style={{ width: "100%", background: "#1e1e2e", borderRadius: "999px", height: "6px" }}>
                      <div className="stat-bar-fill" style={{ width: `${stat.value}%`, background: statColors[stat.label], boxShadow: `0 0 8px ${statColors[stat.label]}` }} />
                    </div>
                  </div>
                ))}
              </div>

{/* Action Buttons */}
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", width: "100%", maxWidth: "420px", marginBottom: "16px" }}>
  {rocky.collapsed ? (
    <button onClick={() => doAction("revive")} disabled={loading} className="btn-action" style={{ gridColumn: "span 2", background: "rgba(255,50,50,0.15)", borderColor: "#ff5555", color: "#ff8888" }}>
      {loading ? "..." : "💀 Revive Rocky"}
    </button>
  ) : (
    <>
      {["feed", "train", "resonate", "stabilize"].map((action) => (
        <button key={action} onClick={() => doAction(action)} disabled={loading} className="btn-action">
          {loading ? "..." : action === "feed" ? "⚡ Feed" : action === "train" ? "💪 Train" : action === "resonate" ? "🌊 Resonate" : "🛡 Stabilize"}
        </button>
      ))}
      <button onClick={() => doAction("checkIn")} disabled={loading} className="btn-action" style={{ gridColumn: "span 2", background: "rgba(130,90,109,0.3)", borderColor: "#825A6D" }}>
        {loading ? "..." : `📅 Daily Check-in ${rocky.checkInStreak > 0 ? `🔥 ${rocky.checkInStreak} day streak` : ""}`}
      </button>
    </>
  )}
</div>            </>
          )}

          {/* Message */}
          {message && (
            <div className="fade-in" style={{ padding: "10px 24px", borderRadius: "999px", marginBottom: "16px", fontSize: "13px", background: msgType === "error" ? "rgba(255,50,50,0.15)" : msgType === "info" ? "rgba(130,90,109,0.2)" : "rgba(130,90,109,0.3)", border: `1px solid ${msgType === "error" ? "#ff5555" : MAIN_COLOR}`, color: msgType === "error" ? "#ff8888" : "white" }}>
              {message}
            </div>
          )}

          {/* Leaderboard */}
          <div style={{ width: "100%", maxWidth: "420px", background: "#111118", borderRadius: "20px", padding: "24px", border: `1px solid ${MAIN_COLOR}22` }}>
            <h2 style={{ color: MAIN_COLOR, textAlign: "center", letterSpacing: "0.2em", fontSize: "14px", marginBottom: "16px" }}>
              🏆 LEADERBOARD
            </h2>
            {leaderboard.length === 0 ? (
              <p style={{ color: "#555", textAlign: "center", fontSize: "13px" }}>Belum ada pemain</p>
            ) : (
              leaderboard.map((entry, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: "10px", marginBottom: "8px", background: i === 0 ? "rgba(255,200,50,0.08)" : i === 1 ? "rgba(200,200,200,0.05)" : i === 2 ? "rgba(200,100,50,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${i === 0 ? "#ffc83288" : i === 1 ? "#aaaaaa44" : i === 2 ? "#cd7f3288" : "#ffffff11"}` }}>
                  <span style={{ fontSize: "13px" }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}{" "}
                    {entry.player.slice(0, 6)}...{entry.player.slice(-4)}
                  </span>
                  <span style={{ fontSize: "12px", color: MAIN_COLOR, fontWeight: "bold" }}>LVL {entry.level}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </main>
  );
}