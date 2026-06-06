import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await API.post('/auth/login', form)
      login(data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body { background: #04050a; overflow: hidden; }

        .root {
          height: 100vh;
          display: grid;
          grid-template-columns: 1fr 480px;
          font-family: 'DM Sans', sans-serif;
          color: #fff;
          overflow: hidden;
        }

        /* ── LEFT CINEMATIC PANEL ── */
        .left {
          position: relative;
          background: #04050a;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 60px;
          overflow: hidden;
        }

        .grid-lines {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridDrift 30s linear infinite;
        }
        @keyframes gridDrift {
          0% { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }

        .orb-a {
          position: absolute;
          width: 600px; height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%);
          top: -150px; left: -100px;
          animation: float 8s ease-in-out infinite;
        }
        .orb-b {
          position: absolute;
          width: 400px; height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%);
          bottom: 100px; right: -50px;
          animation: float 10s ease-in-out infinite reverse;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }

        .video-preview {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 8px;
          padding: 8px;
          opacity: 0.15;
          filter: blur(1px);
        }
        .vp-tile {
          border-radius: 12px;
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border: 1px solid rgba(255,255,255,0.06);
          position: relative;
          overflow: hidden;
        }
        .vp-tile::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.1));
        }
        .vp-tile:nth-child(1) { background: linear-gradient(135deg, #1e1b4b, #312e81); }
        .vp-tile:nth-child(2) { background: linear-gradient(135deg, #0c4a6e, #0369a1); }
        .vp-tile:nth-child(3) { background: linear-gradient(135deg, #14532d, #166534); }
        .vp-tile:nth-child(4) { background: linear-gradient(135deg, #4c1d95, #6d28d9); }

        .left-content {
          position: relative;
          z-index: 2;
        }
        .left-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 48px;
        }
        .logo-mark {
          width: 44px; height: 44px;
          background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px;
          box-shadow: 0 0 30px rgba(139,92,246,0.4);
        }
        .logo-name {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.3px;
        }

        .left-headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(42px, 4vw, 64px);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -2px;
          margin-bottom: 20px;
        }
        .left-headline em {
          font-style: italic;
          background: linear-gradient(90deg, #8b5cf6, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .left-sub {
          font-size: 16px;
          color: rgba(255,255,255,0.4);
          line-height: 1.6;
          max-width: 400px;
          margin-bottom: 40px;
          font-weight: 300;
        }
        .stats-row {
          display: flex;
          gap: 36px;
        }
        .stat-item {}
        .stat-num {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 700;
          color: #fff;
        }
        .stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 2px;
        }

        /* ── RIGHT FORM PANEL ── */
        .right {
          background: #080910;
          border-left: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 48px;
          position: relative;
          overflow: hidden;
        }
        .right::before {
          content: '';
          position: absolute;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%);
          top: -100px; right: -100px;
          pointer-events: none;
        }

        .form-eyebrow {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: rgba(139,92,246,0.8);
          margin-bottom: 12px;
          font-weight: 500;
        }
        .form-title {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          font-weight: 700;
          letter-spacing: -1px;
          margin-bottom: 8px;
          line-height: 1.1;
        }
        .form-subtitle {
          font-size: 14px;
          color: rgba(255,255,255,0.35);
          margin-bottom: 40px;
          font-weight: 300;
        }

        .field {
          margin-bottom: 20px;
          position: relative;
        }
        .field-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: rgba(255,255,255,0.35);
          margin-bottom: 10px;
          display: block;
          font-weight: 500;
          transition: color 0.2s;
        }
        .field.active .field-label { color: rgba(139,92,246,0.9); }

        .input-wrap {
          position: relative;
        }
        .input-wrap input {
          width: 100%;
          padding: 15px 18px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 300;
          outline: none;
          transition: all 0.25s;
          letter-spacing: 0.2px;
        }
        .input-wrap input:focus {
          border-color: rgba(139,92,246,0.6);
          background: rgba(139,92,246,0.06);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.08);
        }
        .input-wrap input::placeholder { color: rgba(255,255,255,0.15); }

        .input-line {
          position: absolute;
          bottom: 0; left: 18px; right: 18px;
          height: 1px;
          background: linear-gradient(90deg, #8b5cf6, #06b6d4);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
          border-radius: 1px;
        }
        .input-wrap input:focus ~ .input-line { transform: scaleX(1); }

        .error-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          color: #fca5a5;
          font-size: 13px;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-weight: 300;
        }

        .btn-submit {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #8b5cf6, #6d28d9);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 8px;
          position: relative;
          overflow: hidden;
          transition: opacity 0.2s, transform 0.15s;
          letter-spacing: 0.3px;
          box-shadow: 0 8px 32px rgba(139,92,246,0.3);
        }
        .btn-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .btn-submit:hover::before { opacity: 1; }
        .btn-submit:hover { transform: translateY(-1px); box-shadow: 0 12px 40px rgba(139,92,246,0.4); }
        .btn-submit:active { transform: translateY(0); }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        .btn-loader {
          display: inline-block;
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .divider-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 28px 0;
        }
        .divider-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
        .divider-text { font-size: 12px; color: rgba(255,255,255,0.2); }

        .footer-link {
          text-align: center;
          font-size: 14px;
          color: rgba(255,255,255,0.3);
          font-weight: 300;
        }
        .footer-link a {
          color: #a78bfa;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
        }
        .footer-link a:hover { color: #c4b5fd; }

        @media (max-width: 900px) {
          .root { grid-template-columns: 1fr; }
          .left { display: none; }
          .right { padding: 48px 32px; }
        }
      `}</style>

      <div className="root">
        {/* Left panel */}
        <div className="left">
          <div className="grid-lines" />
          <div className="orb-a" />
          <div className="orb-b" />
          <div className="video-preview">
            <div className="vp-tile" />
            <div className="vp-tile" />
            <div className="vp-tile" />
            <div className="vp-tile" />
          </div>
          <div className="left-content">
            <div className="left-logo">
              <div className="logo-mark">📹</div>
              <span className="logo-name">ConnectMeet</span>
            </div>
            <h1 className="left-headline">
              Meet anyone,<br /><em>anywhere,</em><br />anytime.
            </h1>
            <p className="left-sub">
              Crystal-clear video. Zero latency. Built on WebRTC — the same technology powering the world's best video platforms.
            </p>
            <div className="stats-row">
              <div className="stat-item">
                <div className="stat-num">HD</div>
                <div className="stat-label">Video Quality</div>
              </div>
              <div className="stat-item">
                <div className="stat-num">&lt;50ms</div>
                <div className="stat-label">Latency</div>
              </div>
              <div className="stat-item">
                <div className="stat-num">P2P</div>
                <div className="stat-label">Encrypted</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="right">
          <div className="form-eyebrow">Welcome back</div>
          <h2 className="form-title">Sign in to your<br />account</h2>
          <p className="form-subtitle">Enter your credentials to continue</p>

          {error && (
            <div className="error-box">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={`field ${focused === 'email' ? 'active' : ''}`}>
              <label className="field-label">Email address</label>
              <div className="input-wrap">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  required
                />
                <div className="input-line" />
              </div>
            </div>

            <div className={`field ${focused === 'password' ? 'active' : ''}`}>
              <label className="field-label">Password</label>
              <div className="input-wrap">
                <input
                  type="password"
                  placeholder="••••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  required
                />
                <div className="input-line" />
              </div>
            </div>

            <button className="btn-submit" type="submit" disabled={loading}>
              {loading && <span className="btn-loader" />}
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <div className="divider-row">
            <div className="divider-line" />
            <span className="divider-text">New to ConnectMeet?</span>
            <div className="divider-line" />
          </div>

          <p className="footer-link">
            <Link to="/register">Create a free account →</Link>
          </p>
        </div>
      </div>
    </>
  )
}
