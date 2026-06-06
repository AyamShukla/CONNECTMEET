import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api/axios'

export default function Home() {
  const { user, logout } = useAuth()
  const [joinId, setJoinId] = useState('')
  const [createdRoom, setCreatedRoom] = useState(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [time, setTime] = useState(new Date())
  const navigate = useNavigate()

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const hour = time.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const dateStr = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
  const firstName = user.name.split(' ')[0]

  const createRoom = async () => {
    setLoading(true)
    try {
      const { data } = await API.post('/rooms', { title: 'My Meeting' })
      setCreatedRoom(data.roomId)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const copyAndJoin = () => {
    navigator.clipboard.writeText(createdRoom)
    setCopied(true)
    setTimeout(() => navigate(`/room/${createdRoom}`), 700)
  }

  const joinRoom = () => {
    if (joinId.trim()) navigate(`/room/${joinId.trim()}`)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; height: 100%; overflow: hidden; }
        body { background: #060609; font-family: 'DM Sans', sans-serif; color: #fff; }

        .home { width: 100vw; height: 100vh; display: grid; grid-template-rows: 64px 1fr; overflow: hidden; position: relative; }

        .bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; }
        .bg-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px); background-size: 72px 72px; }
        .bg-orb1 { position: absolute; width: 70vw; height: 70vw; max-width: 900px; max-height: 900px; border-radius: 50%; background: radial-gradient(circle, rgba(109,40,217,0.22) 0%, rgba(109,40,217,0.06) 45%, transparent 70%); top: -20vh; left: -10vw; animation: drift1 18s ease-in-out infinite; }
        .bg-orb2 { position: absolute; width: 55vw; height: 55vw; max-width: 700px; max-height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(6,182,212,0.16) 0%, rgba(6,182,212,0.04) 50%, transparent 70%); bottom: -15vh; right: -10vw; animation: drift2 22s ease-in-out infinite; }
        .bg-orb3 { position: absolute; width: 30vw; height: 30vw; max-width: 400px; max-height: 400px; border-radius: 50%; background: radial-gradient(circle, rgba(244,114,182,0.1) 0%, transparent 70%); top: 40vh; left: 50%; transform: translateX(-50%); animation: drift1 14s ease-in-out infinite reverse; }
        @keyframes drift1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(3vw,2vh) scale(1.04)} 66%{transform:translate(-2vw,4vh) scale(0.97)} }
        @keyframes drift2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-4vw,-3vh) scale(1.06)} }

        .nav { position: relative; z-index: 10; display: flex; align-items: center; justify-content: space-between; padding: 0 48px; border-bottom: 1px solid rgba(255,255,255,0.06); background: rgba(6,6,9,0.65); backdrop-filter: blur(24px); }
        .nav-logo { display: flex; align-items: center; gap: 11px; }
        .nav-logo-mark { width: 36px; height: 36px; background: linear-gradient(135deg, #7c3aed, #06b6d4); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 17px; box-shadow: 0 0 24px rgba(124,58,237,0.4); }
        .nav-logo-text { font-family: 'Instrument Serif', serif; font-size: 20px; letter-spacing: -0.3px; color: rgba(255,255,255,0.92); }
        .nav-center { position: absolute; left: 50%; transform: translateX(-50%); font-size: 13px; color: rgba(255,255,255,0.28); font-weight: 300; }
        .nav-right { display: flex; align-items: center; gap: 14px; }
        .nav-time-badge { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; padding: 5px 12px; font-size: 13px; color: rgba(255,255,255,0.4); font-variant-numeric: tabular-nums; font-weight: 300; }
        .nav-avatar { width: 34px; height: 34px; background: linear-gradient(135deg, #7c3aed, #06b6d4); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; box-shadow: 0 0 0 2px rgba(124,58,237,0.3); }
        .nav-username { font-size: 14px; color: rgba(255,255,255,0.45); font-weight: 300; }
        .btn-signout { padding: 7px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; color: rgba(255,255,255,0.4); font-family: 'DM Sans', sans-serif; font-size: 13px; cursor: pointer; transition: all 0.2s; font-weight: 300; }
        .btn-signout:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.7); }

        .content { position: relative; z-index: 2; display: grid; grid-template-rows: auto 1fr; overflow: hidden; }

        .hero { padding: 48px 48px 32px; }
        .hero-tag { display: inline-flex; align-items: center; gap: 7px; background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.2); border-radius: 100px; padding: 5px 14px; font-size: 11px; color: rgba(167,139,250,0.9); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 20px; font-weight: 500; }
        .hero-tag-dot { width: 5px; height: 5px; background: #7c3aed; border-radius: 50%; animation: blink 2s ease-in-out infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        .hero-title { font-family: 'Instrument Serif', serif; font-size: clamp(50px, 6vw, 82px); line-height: 0.95; letter-spacing: -3px; margin-bottom: 14px; }
        .hero-title .dim { color: rgba(255,255,255,0.28); }
        .hero-title .accent { font-style: italic; background: linear-gradient(90deg, #a78bfa, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .hero-sub { font-size: 15px; color: rgba(255,255,255,0.32); font-weight: 300; }

        .cards-row { display: grid; grid-template-columns: 1fr 1fr 310px; gap: 14px; padding: 0 48px 36px; align-items: stretch; }

        .card { border-radius: 22px; padding: 32px; position: relative; overflow: hidden; display: flex; flex-direction: column; }
        .card-new { background: radial-gradient(ellipse 80% 60% at 90% 10%, rgba(124,58,237,0.28) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 10% 90%, rgba(6,182,212,0.1) 0%, transparent 60%), rgba(255,255,255,0.03); border: 1px solid rgba(124,58,237,0.22); transition: border-color 0.3s, transform 0.3s; }
        .card-new:hover { border-color: rgba(124,58,237,0.42); transform: translateY(-2px); }
        .card-join { background: radial-gradient(ellipse 80% 60% at 90% 10%, rgba(6,182,212,0.22) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 10% 90%, rgba(124,58,237,0.08) 0%, transparent 60%), rgba(255,255,255,0.03); border: 1px solid rgba(6,182,212,0.18); transition: border-color 0.3s, transform 0.3s; }
        .card-join:hover { border-color: rgba(6,182,212,0.38); transform: translateY(-2px); }
        .card-shimmer { position: absolute; inset: 0; background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.025) 50%, transparent 60%); background-size: 200% 100%; animation: shimmer 5s ease-in-out infinite; }
        @keyframes shimmer { 0%{background-position:-100% 0} 100%{background-position:200% 0} }

        .card-num { font-family: 'Instrument Serif', serif; font-size: 11px; color: rgba(255,255,255,0.16); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px; position: relative; z-index: 1; }
        .card-icon { width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 18px; position: relative; z-index: 1; }
        .icon-v { background: rgba(124,58,237,0.18); border: 1px solid rgba(124,58,237,0.28); box-shadow: 0 0 20px rgba(124,58,237,0.2); }
        .icon-j { background: rgba(6,182,212,0.14); border: 1px solid rgba(6,182,212,0.24); box-shadow: 0 0 20px rgba(6,182,212,0.15); }
        .card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.22); margin-bottom: 7px; position: relative; z-index: 1; }
        .card-title { font-family: 'Instrument Serif', serif; font-size: 28px; letter-spacing: -0.8px; margin-bottom: 10px; line-height: 1.1; position: relative; z-index: 1; }
        .card-desc { font-size: 14px; color: rgba(255,255,255,0.33); line-height: 1.65; font-weight: 300; flex: 1; position: relative; z-index: 1; }
        .card-footer { margin-top: 26px; position: relative; z-index: 1; }

        .btn-new { width: 100%; padding: 15px 20px; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: #fff; border: none; border-radius: 13px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; cursor: pointer; box-shadow: 0 6px 24px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15); transition: all 0.25s; }
        .btn-new:hover { box-shadow: 0 10px 32px rgba(124,58,237,0.55); transform: translateY(-1px); }
        .btn-new:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        .room-box { background: rgba(124,58,237,0.08); border: 1px solid rgba(124,58,237,0.22); border-radius: 13px; padding: 15px 18px; margin-bottom: 11px; }
        .room-box-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,0.28); margin-bottom: 5px; }
        .room-box-id { font-family: 'Instrument Serif', serif; font-size: 24px; letter-spacing: 3px; color: #c4b5fd; }
        .btn-copy { width: 100%; padding: 15px; background: rgba(124,58,237,0.2); border: 1px solid rgba(124,58,237,0.35); color: #c4b5fd; border-radius: 13px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .btn-copy:hover { background: rgba(124,58,237,0.32); }

        .join-inp { width: 100%; padding: 14px 17px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 13px; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 300; outline: none; margin-bottom: 11px; transition: all 0.25s; letter-spacing: 0.5px; }
        .join-inp:focus { border-color: rgba(6,182,212,0.5); background: rgba(6,182,212,0.05); box-shadow: 0 0 0 3px rgba(6,182,212,0.08); }
        .join-inp::placeholder { color: rgba(255,255,255,0.15); letter-spacing: 0; }
        .btn-enter { width: 100%; padding: 15px; background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); color: #fff; border: none; border-radius: 13px; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 500; cursor: pointer; box-shadow: 0 6px 24px rgba(6,182,212,0.35), inset 0 1px 0 rgba(255,255,255,0.12); transition: all 0.25s; }
        .btn-enter:hover { box-shadow: 0 10px 32px rgba(6,182,212,0.5); transform: translateY(-1px); }

        .sidebar { display: flex; flex-direction: column; gap: 12px; }
        .sb { background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 20px; padding: 22px 24px; transition: border-color 0.2s; }
        .sb:hover { border-color: rgba(255,255,255,0.1); }
        .clock-time { font-family: 'Instrument Serif', serif; font-size: 48px; letter-spacing: -3px; line-height: 1; color: #fff; margin-bottom: 4px; font-variant-numeric: tabular-nums; }
        .clock-date { font-size: 12px; color: rgba(255,255,255,0.28); font-weight: 300; }
        .status-row { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
        .status-dot { width: 7px; height: 7px; background: #22c55e; border-radius: 50%; animation: glow 2s infinite; }
        @keyframes glow { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.4)} 50%{box-shadow:0 0 0 5px rgba(34,197,94,0)} }
        .status-txt { font-size: 12px; color: rgba(255,255,255,0.32); font-weight: 300; }
        .tips-head { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.22); margin-bottom: 14px; }
        .tip { display: flex; align-items: flex-start; gap: 11px; margin-bottom: 12px; }
        .tip:last-child { margin-bottom: 0; }
        .tip-ico { font-size: 15px; flex-shrink: 0; line-height: 1.4; }
        .tip-txt { font-size: 13px; color: rgba(255,255,255,0.35); line-height: 1.55; font-weight: 300; }
        .spin { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.25); border-top-color: #fff; border-radius: 50%; animation: sp 0.6s linear infinite; vertical-align: middle; margin-right: 7px; }
        @keyframes sp { to { transform: rotate(360deg); } }
      `}</style>

      <div className="bg">
        <div className="bg-grid" />
        <div className="bg-orb1" />
        <div className="bg-orb2" />
        <div className="bg-orb3" />
      </div>

      <div className="home">
        <nav className="nav">
          <div className="nav-logo">
            <div className="nav-logo-mark">📹</div>
            <span className="nav-logo-text">ConnectMeet</span>
          </div>
          <div className="nav-center">{dateStr}</div>
          <div className="nav-right">
            <div className="nav-time-badge">{timeStr}</div>
            <div className="nav-avatar">{initials}</div>
            <span className="nav-username">{user.name}</span>
            <button className="btn-signout" onClick={logout}>Sign out</button>
          </div>
        </nav>

        <div className="content">
          <div className="hero">
            <div className="hero-tag"><div className="hero-tag-dot" />{greeting}</div>
            <h1 className="hero-title">
              <span className="dim">{firstName},</span><br />
              ready to <span className="accent">connect?</span>
            </h1>
            <p className="hero-sub">Start a meeting or join with a room ID — no downloads, no friction.</p>
          </div>

          <div className="cards-row">
            <div className="card card-new">
              <div className="card-shimmer" />
              <div className="card-num">01 — New meeting</div>
              <div className="card-icon icon-v">🎥</div>
              <div className="card-label">Instant meeting</div>
              <div className="card-title">Start a new<br />meeting</div>
              <p className="card-desc">Launch a room instantly and share the ID with anyone to let them join with one click.</p>
              <div className="card-footer">
                {!createdRoom ? (
                  <button className="btn-new" onClick={createRoom} disabled={loading}>
                    {loading && <span className="spin" />}
                    {loading ? 'Creating...' : '+ New meeting'}
                  </button>
                ) : (
                  <>
                    <div className="room-box">
                      <div className="room-box-label">Room ID — share this</div>
                      <div className="room-box-id">{createdRoom}</div>
                    </div>
                    <button className="btn-copy" onClick={copyAndJoin}>
                      {copied ? '✓ Copied! Joining...' : 'Copy ID & join →'}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="card card-join">
              <div className="card-shimmer" />
              <div className="card-num">02 — Join a room</div>
              <div className="card-icon icon-j">🔗</div>
              <div className="card-label">Join a room</div>
              <div className="card-title">Enter a<br />meeting</div>
              <p className="card-desc">Have a room ID? Paste it below and jump straight into an active session with your team.</p>
              <div className="card-footer">
                <input className="join-inp" placeholder="Paste room ID..." value={joinId}
                  onChange={e => setJoinId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && joinRoom()} />
                <button className="btn-enter" onClick={joinRoom}>Join meeting →</button>
              </div>
            </div>

            <div className="sidebar">
              <div className="sb">
                <div className="status-row">
                  <div className="status-dot" /><span className="status-txt">All systems live</span>
                </div>
                <div className="clock-time">{timeStr}</div>
                <div className="clock-date">{dateStr}</div>
              </div>
              <div className="sb" style={{flex:1}}>
                <div className="tips-head">Quick tips</div>
                {[
                  {ico:'🎤', txt:'Mute when not speaking to cut background noise'},
                  {ico:'🖥', txt:'Share your screen to present slides or demos'},
                  {ico:'✋', txt:'Raise your hand to ask questions silently'},
                  {ico:'👑', txt:'Hosts can remove participants and end for all'},
                ].map((t,i) => (
                  <div className="tip" key={i}>
                    <span className="tip-ico">{t.ico}</span>
                    <span className="tip-txt">{t.txt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
