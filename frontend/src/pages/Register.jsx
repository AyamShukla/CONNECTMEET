import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
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
      const { data } = await API.post('/auth/register', form)
      login(data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
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

        .root { height: 100vh; display: grid; grid-template-columns: 480px 1fr; font-family: 'DM Sans', sans-serif; color: #fff; overflow: hidden; }

        .left {
          background: #080910;
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 48px;
          position: relative;
          overflow: hidden;
        }
        .left::before {
          content: '';
          position: absolute;
          width: 300px; height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%);
          bottom: -80px; left: -80px;
          pointer-events: none;
        }
        .left::after {
          content: '';
          position: absolute;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%);
          top: -50px; right: -50px;
          pointer-events: none;
        }

        .logo-row { display: flex; align-items: center; gap: 12px; margin-bottom: 52px; }
        .logo-mark { width: 44px; height: 44px; background: linear-gradient(135deg, #06b6d4, #8b5cf6); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: 0 0 30px rgba(6,182,212,0.35); }
        .logo-name { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; }

        .form-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: rgba(6,182,212,0.8); margin-bottom: 12px; font-weight: 500; }
        .form-title { font-family: 'Playfair Display', serif; font-size: 34px; font-weight: 700; letter-spacing: -1px; margin-bottom: 8px; line-height: 1.1; }
        .form-subtitle { font-size: 14px; color: rgba(255,255,255,0.35); margin-bottom: 38px; font-weight: 300; }

        .field { margin-bottom: 18px; position: relative; }
        .field-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: rgba(255,255,255,0.35); margin-bottom: 10px; display: block; font-weight: 500; transition: color 0.2s; }
        .field.active .field-label { color: rgba(6,182,212,0.9); }
        .input-wrap { position: relative; }
        .input-wrap input { width: 100%; padding: 14px 18px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 300; outline: none; transition: all 0.25s; }
        .input-wrap input:focus { border-color: rgba(6,182,212,0.5); background: rgba(6,182,212,0.05); box-shadow: 0 0 0 3px rgba(6,182,212,0.07); }
        .input-wrap input::placeholder { color: rgba(255,255,255,0.15); }
        .input-line { position: absolute; bottom: 0; left: 18px; right: 18px; height: 1px; background: linear-gradient(90deg, #06b6d4, #8b5cf6); transform: scaleX(0); transform-origin: left; transition: transform 0.3s ease; border-radius: 1px; }
        .input-wrap input:focus ~ .input-line { transform: scaleX(1); }

        .error-box { display: flex; align-items: center; gap: 8px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #fca5a5; font-size: 13px; padding: 12px 16px; border-radius: 10px; margin-bottom: 18px; font-weight: 300; }

        .btn-submit { width: 100%; padding: 16px; background: linear-gradient(135deg, #06b6d4, #0891b2); color: #fff; border: none; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; cursor: pointer; margin-top: 8px; position: relative; overflow: hidden; transition: all 0.2s; box-shadow: 0 8px 32px rgba(6,182,212,0.3); }
        .btn-submit::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent); opacity: 0; transition: opacity 0.2s; }
        .btn-submit:hover::before { opacity: 1; }
        .btn-submit:hover { transform: translateY(-1px); box-shadow: 0 12px 40px rgba(6,182,212,0.4); }
        .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-loader { display: inline-block; width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; vertical-align: middle; margin-right: 8px; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .footer-link { text-align: center; font-size: 14px; color: rgba(255,255,255,0.3); margin-top: 28px; font-weight: 300; }
        .footer-link a { color: #22d3ee; text-decoration: none; font-weight: 500; }
        .footer-link a:hover { color: #67e8f9; }

        /* Right decorative panel */
        .right {
          position: relative;
          background: #04050a;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .grid-lines { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 50px 50px; }

        .orb-main { position: absolute; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(139,92,246,0.08) 40%, transparent 70%); animation: pulse 6s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.08); opacity: 0.7; } }

        .feature-cards {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 320px;
        }
        .fc {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 20px 22px;
          display: flex;
          align-items: center;
          gap: 16px;
          backdrop-filter: blur(10px);
          animation: slideIn 0.6s ease both;
        }
        .fc:nth-child(1) { animation-delay: 0.1s; }
        .fc:nth-child(2) { animation-delay: 0.2s; }
        .fc:nth-child(3) { animation-delay: 0.3s; }
        .fc:nth-child(4) { animation-delay: 0.4s; }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .fc-icon { font-size: 24px; flex-shrink: 0; }
        .fc-title { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85); margin-bottom: 2px; }
        .fc-sub { font-size: 12px; color: rgba(255,255,255,0.3); font-weight: 300; }

        @media (max-width: 900px) {
          .root { grid-template-columns: 1fr; }
          .right { display: none; }
          .left { padding: 48px 32px; }
        }
      `}</style>

      <div className="root">
        <div className="left">
          <div className="logo-row">
            <div className="logo-mark">📹</div>
            <span className="logo-name">ConnectMeet</span>
          </div>

          <div className="form-eyebrow">Get started free</div>
          <h2 className="form-title">Create your<br />account</h2>
          <p className="form-subtitle">Join thousands already meeting on ConnectMeet</p>

          {error && <div className="error-box"><span>⚠</span> {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={`field ${focused === 'name' ? 'active' : ''}`}>
              <label className="field-label">Full name</label>
              <div className="input-wrap">
                <input placeholder="Ayam Shukla" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  onFocus={() => setFocused('name')} onBlur={() => setFocused(null)} required />
                <div className="input-line" />
              </div>
            </div>
            <div className={`field ${focused === 'email' ? 'active' : ''}`}>
              <label className="field-label">Email address</label>
              <div className="input-wrap">
                <input type="email" placeholder="you@example.com" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} required />
                <div className="input-line" />
              </div>
            </div>
            <div className={`field ${focused === 'password' ? 'active' : ''}`}>
              <label className="field-label">Password</label>
              <div className="input-wrap">
                <input type="password" placeholder="Min. 8 characters" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} required />
                <div className="input-line" />
              </div>
            </div>
            <button className="btn-submit" type="submit" disabled={loading}>
              {loading && <span className="btn-loader" />}
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>

          <p className="footer-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>

        <div className="right">
          <div className="grid-lines" />
          <div className="orb-main" />
          <div className="feature-cards">
            {[
              { icon: '🎥', title: 'HD Video calling', sub: 'Crystal clear WebRTC video' },
              { icon: '🖥', title: 'Screen sharing', sub: 'Share your screen instantly' },
              { icon: '💬', title: 'In-call chat', sub: 'Message without interrupting' },
              { icon: '👑', title: 'Host controls', sub: 'Manage your meeting room' },
            ].map((f, i) => (
              <div className="fc" key={i}>
                <div className="fc-icon">{f.icon}</div>
                <div>
                  <div className="fc-title">{f.title}</div>
                  <div className="fc-sub">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
