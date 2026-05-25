"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";
import { api } from "@/lib/api";

const FIELD_GUIDE = ["FIELD", "GUIDE", "TO THE", "GEOLOGIC", "UNDER-", "GROUND"];

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.15)",
  color: "white",
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.15em",
  color: "rgba(255,255,255,0.45)",
  marginBottom: 6,
};

type Mode = null | "login" | "signup";

export default function HomePage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [mode, setMode] = useState<Mode>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("visitor");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setError("");
    setMode(m => m === next ? null : next);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await api.post<{ access_token: string; user_id: string; name: string; role: "visitor" | "operator" | "guide" | "admin" }>("/api/auth/login", { email, password });
      setAuth(data.access_token, { id: data.user_id, name: data.name, role: data.role });
      router.push(data.role === "guide" ? "/dashboard/guide" : "/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally { setLoading(false); }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await api.post<{ access_token: string; user_id: string; name: string; role: "visitor" | "operator" | "admin" }>("/api/auth/register", { name, email, password, role });
      setAuth(data.access_token, { id: data.user_id, name: data.name, role: data.role });
      router.push(data.role === "operator" ? "/dashboard" : "/sites");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally { setLoading(false); }
  }

  const expanded = mode !== null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#1A1F2E" }}>

      {/* Left — field guide label */}
      <div style={{ display: "none", width: "30%", flexDirection: "column", justifyContent: "flex-start", padding: "56px 40px 0", backgroundColor: "#3D4F5C", flexShrink: 0 }}
        className="sm:flex">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {FIELD_GUIDE.map((word) => (
            <p key={word} style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.35em", color: "#8A9BAE", margin: 0 }}>
              {word}
            </p>
          ))}
        </div>
      </div>

      {/* Right — wordmark + CTAs */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 56px" }}>

        {/* Wordmark */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "clamp(3rem, 8vw, 7.5rem)", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em", color: "white", userSelect: "none" }}>
              digby
            </div>
            <div style={{ position: "relative", display: "inline-block" }}>
              <div style={{ fontFamily: "var(--font-display), Georgia, serif", fontSize: "clamp(3rem, 8vw, 7.5rem)", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.02em", fontStyle: "italic", color: "#E8A84A", userSelect: "none" }}>
                .rocks
              </div>
              <div style={{ position: "absolute", bottom: 4, left: 0, right: 0, height: 3, backgroundColor: "#C97B3A" }} />
            </div>
          </div>

          {/* Tagline */}
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.25em", color: "rgba(255,255,255,0.45)", marginBottom: 28 }}>
            Ontario&apos;s Rockhound Booking Platform
          </p>

          {/* Mode toggle buttons */}
          <div style={{ display: "flex", gap: 12, marginBottom: 0 }}>
            {(["login", "signup"] as Mode[]).map((m) => (
              <button key={m} onClick={() => switchMode(m)}
                style={{
                  padding: "10px 28px", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.2s",
                  background: mode === m ? "#C97B3A" : "transparent",
                  color: mode === m ? "white" : "rgba(255,255,255,0.6)",
                  border: mode === m ? "1px solid #C97B3A" : "1px solid rgba(255,255,255,0.2)",
                }}>
                {m === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          {/* Expanding form area */}
          <div style={{
            overflow: "hidden",
            maxHeight: expanded ? 420 : 0,
            opacity: expanded ? 1 : 0,
            transition: "max-height 0.35s ease, opacity 0.25s ease",
            marginTop: expanded ? 24 : 0,
          }}>
            {mode === "login" && (
              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 360 }}>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div>
                  <label style={labelStyle}>Password</label>
                  <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                {error && <p style={{ fontSize: 13, color: "#E8A84A", margin: 0 }}>{error}</p>}
                <button type="submit" disabled={loading}
                  style={{ padding: "10px 28px", fontSize: 13, fontWeight: 600, background: "#C97B3A", color: "white", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, alignSelf: "flex-start" }}>
                  {loading ? "Signing in…" : "Sign in →"}
                </button>
              </form>
            )}

            {mode === "signup" && (
              <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 360 }}>
                <div>
                  <label style={labelStyle}>Full name</label>
                  <input style={inputStyle} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
                </div>
                <div>
                  <label style={labelStyle}>Password</label>
                  <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <div>
                  <label style={labelStyle}>I am a…</label>
                  <select value={role} onChange={e => setRole(e.target.value)}
                    style={{ ...inputStyle, appearance: "none" }}>
                    <option value="visitor">Visitor / Rockhound</option>
                    <option value="operator">Operator / Landowner</option>
                    <option value="guide">Guide / Expert</option>
                  </select>
                </div>
                {error && <p style={{ fontSize: 13, color: "#E8A84A", margin: 0 }}>{error}</p>}
                <button type="submit" disabled={loading}
                  style={{ padding: "10px 28px", fontSize: 13, fontWeight: 600, background: "#C97B3A", color: "white", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, alignSelf: "flex-start" }}>
                  {loading ? "Creating account…" : "Create account →"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* URL footer */}
        <p style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.3em", color: "rgba(255,255,255,0.2)" }}>
          www.digby.rocks
        </p>
      </div>
    </div>
  );
}
