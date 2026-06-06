import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { io } from 'socket.io-client'

const SOCKET_URL = 'http://localhost:5000'
const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

export default function Room() {
  const { roomId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const socketRef = useRef(null)
  const localStreamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const peersRef = useRef({})
  const localVideoRef = useRef(null)
  const chatBottomRef = useRef(null)

  const [peers, setPeers] = useState([])
  const [remoteStreams, setRemoteStreams] = useState({})
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [messages, setMessages] = useState([])
  const [msgInput, setMsgInput] = useState('')
  const [panel, setPanel] = useState(null)
  const [copied, setCopied] = useState(false)
  const [duration, setDuration] = useState(0)
  const [isHost, setIsHost] = useState(false)
  const [hostSocketId, setHostSocketId] = useState(null)
  const [participants, setParticipants] = useState([])
  const [raisedHands, setRaisedHands] = useState(new Set())
  const [notification, setNotification] = useState(null)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const showNotif = (msg, type = 'info') => {
    setNotification({ msg, type })
    setTimeout(() => setNotification(null), 3000)
  }

  useEffect(() => {
    const t = setInterval(() => setDuration(d => d + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const formatTime = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`
  }

  useEffect(() => {
    const socket = io(SOCKET_URL)
    socketRef.current = socket

    function makePeer(targetId, initiator) {
      const pc = new RTCPeerConnection(ICE)
      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('send-ice-candidate', { to: targetId, candidate: e.candidate })
      }
      pc.ontrack = (e) => {
        setRemoteStreams(prev => ({ ...prev, [targetId]: e.streams[0] }))
      }
      localStreamRef.current?.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current))
      if (initiator) {
        pc.createOffer()
          .then(o => pc.setLocalDescription(o))
          .then(() => socket.emit('send-offer', { to: targetId, offer: pc.localDescription }))
      }
      peersRef.current[targetId] = pc
      return pc
    }

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
        socket.emit('join-room', { roomId, userId: user._id, userName: user.name })
      })
      .catch(() => {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            localStreamRef.current = stream
            socket.emit('join-room', { roomId, userId: user._id, userName: user.name })
          })
      })

    socket.on('host-info', ({ hostSocketId }) => {
      setHostSocketId(hostSocketId)
      setIsHost(socket.id === hostSocketId)
    })
    socket.on('host-changed', ({ hostSocketId }) => {
      setHostSocketId(hostSocketId)
      setIsHost(socket.id === hostSocketId)
      if (socket.id === hostSocketId) showNotif('You are now the host', 'success')
    })
    socket.on('participants-update', ({ participants, hostSocketId }) => {
      setParticipants(participants)
      setHostSocketId(hostSocketId)
      setIsHost(socket.id === hostSocketId)
    })
    socket.on('existing-participants', (list) => {
      setPeers(list)
      list.forEach(({ socketId }) => makePeer(socketId, true))
    })
    socket.on('user-joined', ({ socketId, userName }) => {
      setPeers(prev => [...prev, { socketId, userName }])
      makePeer(socketId, false)
      showNotif(`${userName} joined`)
    })
    socket.on('receive-offer', async ({ from, offer }) => {
      const pc = peersRef.current[from] || makePeer(from, false)
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socket.emit('send-answer', { to: from, answer })
    })
    socket.on('receive-answer', async ({ from, answer }) => {
      await peersRef.current[from]?.setRemoteDescription(new RTCSessionDescription(answer))
    })
    socket.on('receive-ice-candidate', async ({ from, candidate }) => {
      await peersRef.current[from]?.addIceCandidate(new RTCIceCandidate(candidate))
    })
    socket.on('user-left', ({ socketId }) => {
      peersRef.current[socketId]?.close()
      delete peersRef.current[socketId]
      setPeers(prev => {
        const leaving = prev.find(p => p.socketId === socketId)
        if (leaving) showNotif(`${leaving.userName} left`)
        return prev.filter(p => p.socketId !== socketId)
      })
      setRemoteStreams(prev => { const n = { ...prev }; delete n[socketId]; return n })
    })
    socket.on('receive-message', (msg) => {
      setMessages(prev => [...prev, msg])
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    })
    socket.on('hand-raised', ({ socketId, userName }) => {
      setRaisedHands(prev => new Set([...prev, socketId]))
      showNotif(`✋ ${userName} raised their hand`)
    })
    socket.on('hand-lowered', ({ socketId }) => {
      setRaisedHands(prev => { const n = new Set(prev); n.delete(socketId); return n })
    })
    socket.on('you-were-removed', () => {
      alert('You have been removed from the meeting by the host.')
      navigate('/')
    })
    socket.on('meeting-ended', () => {
      alert('The host has ended the meeting.')
      navigate('/')
    })

    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop())
      screenStreamRef.current?.getTracks().forEach(t => t.stop())
      Object.values(peersRef.current).forEach(pc => pc.close())
      socket.disconnect()
    }
  }, [roomId, user, navigate])

  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setIsMuted(!track.enabled)
      socketRef.current.emit('toggle-audio', { roomId, isMuted: !track.enabled })
    }
  }
  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (track) {
      track.enabled = !track.enabled
      setIsVideoOff(!track.enabled)
      socketRef.current.emit('toggle-video', { roomId, isVideoOff: !track.enabled })
    }
  }
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop())
      const cameraTrack = localStreamRef.current?.getVideoTracks()[0]
      if (cameraTrack) {
        Object.values(peersRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video')
          sender?.replaceTrack(cameraTrack)
        })
        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current
      }
      setIsScreenSharing(false)
      socketRef.current.emit('screen-share-stopped', { roomId })
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
        screenStreamRef.current = screenStream
        const screenTrack = screenStream.getVideoTracks()[0]
        Object.values(peersRef.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video')
          sender?.replaceTrack(screenTrack)
        })
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream
        setIsScreenSharing(true)
        socketRef.current.emit('screen-share-started', { roomId })
        screenTrack.onended = () => toggleScreenShare()
      } catch (err) {
        console.log('Screen share cancelled or denied')
      }
    }
  }
  const toggleHand = () => {
    const newState = !isHandRaised
    setIsHandRaised(newState)
    if (newState) socketRef.current.emit('raise-hand', { roomId, userName: user.name })
    else socketRef.current.emit('lower-hand', { roomId })
  }
  const sendMessage = () => {
    if (!msgInput.trim()) return
    socketRef.current.emit('send-message', { roomId, senderName: user.name, content: msgInput })
    setMsgInput('')
  }
  const removeParticipant = (targetSocketId) => {
    socketRef.current.emit('remove-participant', { roomId, targetSocketId })
  }
  const endMeeting = () => {
    socketRef.current.emit('end-meeting', { roomId })
    navigate('/')
  }
  const leaveRoom = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    Object.values(peersRef.current).forEach(pc => pc.close())
    socketRef.current.disconnect()
    navigate('/')
  }
  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const togglePanel = (name) => setPanel(p => p === name ? null : name)

  const totalParticipants = peers.length + 1
  const unreadIndicator = messages.length > 0 && panel !== 'chat'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700&family=Cabinet+Grotesk:wght@300;400;500;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #060810; overflow: hidden; }

        .rm {
          --c1: #8b7fff;
          --c2: #00e5b8;
          --c3: #ff6b9d;
          --bg: #060810;
          --surf: #0c0f1c;
          --surf2: #10142a;
          --bd: rgba(255,255,255,0.06);
          --bdh: rgba(255,255,255,0.13);
          --txt: #e8ecf7;
          --muted: rgba(232,236,247,0.4);
          --faint: rgba(232,236,247,0.18);
          display: flex; flex-direction: column; height: 100vh;
          background: var(--bg); font-family: 'Cabinet Grotesk', sans-serif;
          color: var(--txt); position: relative; overflow: hidden;
        }

        /* ── Ambient bg orbs ── */
        .rm-orb {
          position: fixed; border-radius: 50%; filter: blur(100px);
          pointer-events: none; z-index: 0;
        }
        .rm-orb-a {
          width: 500px; height: 500px; left: -160px; top: -100px;
          background: radial-gradient(circle, rgba(139,127,255,0.18) 0%, transparent 70%);
        }
        .rm-orb-b {
          width: 400px; height: 400px; right: -100px; bottom: 60px;
          background: radial-gradient(circle, rgba(0,229,184,0.13) 0%, transparent 70%);
        }

        /* ── Topbar ── */
        .topbar {
          position: relative; z-index: 20;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px; height: 62px; flex-shrink: 0;
          background: rgba(6,8,16,0.85);
          border-bottom: 1px solid var(--bd);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
        }

        .tl { display: flex; align-items: center; gap: 14px; }

        .brand {
          font-family: 'Cabinet Grotesk', sans-serif;
          font-size: 15px; font-weight: 800; letter-spacing: -0.3px;
        }
        .brand b {
          background: linear-gradient(90deg, var(--c1), var(--c2));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }

        .tb-sep { width: 1px; height: 16px; background: var(--bd); }

        .live-dot-wrap {
          display: flex; align-items: center; gap: 6px;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.22);
          padding: 4px 12px; border-radius: 100px;
        }
        .live-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #ef4444;
          animation: livepulse 1.8s ease infinite;
        }
        @keyframes livepulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        .live-text { font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: #f87171; }

        .timer-chip {
          font-size: 13px; font-weight: 600; color: var(--muted);
          font-variant-numeric: tabular-nums; letter-spacing: 0.5px;
        }

        .count-chip {
          display: flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.04); border: 1px solid var(--bd);
          padding: 4px 12px; border-radius: 100px; font-size: 12px; color: var(--muted);
        }
        .count-dot { width: 6px; height: 6px; background: var(--c2); border-radius: 50%; box-shadow: 0 0 6px var(--c2); }

        .badge {
          font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 100px;
          letter-spacing: 0.3px; text-transform: uppercase;
        }
        .badge-host { background: rgba(139,127,255,0.14); border: 1px solid rgba(139,127,255,0.28); color: var(--c1); }
        .badge-share { background: rgba(0,229,184,0.1); border: 1px solid rgba(0,229,184,0.25); color: var(--c2); }

        .tr { display: flex; align-items: center; gap: 10px; }

        .room-pill {
          display: flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.04); border: 1px solid var(--bd);
          padding: 7px 16px; border-radius: 100px; cursor: pointer;
          transition: all 0.2s; font-size: 12px; color: var(--muted);
          letter-spacing: 0.8px; font-weight: 500;
        }
        .room-pill:hover { background: rgba(255,255,255,0.08); border-color: var(--bdh); color: var(--txt); }
        .room-pill-icon { font-size: 11px; opacity: 0.6; }

        /* ── Notification toast ── */
        .notif {
          position: fixed; top: 74px; left: 50%; transform: translateX(-50%);
          background: rgba(16,20,36,0.96); border: 1px solid var(--bd);
          backdrop-filter: blur(20px); padding: 10px 22px; border-radius: 100px;
          font-size: 13px; font-weight: 500; color: rgba(232,236,247,0.85);
          z-index: 100; white-space: nowrap;
          animation: notifIn 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes notifIn { from{opacity:0;transform:translateX(-50%) translateY(-10px) scale(0.95)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }

        /* ── Main layout ── */
        .main { display: flex; flex: 1; overflow: hidden; position: relative; z-index: 1; }

        /* ── Video area ── */
        .video-area {
          flex: 1; display: flex; flex-wrap: wrap;
          align-content: center; justify-content: center;
          gap: 12px; padding: 18px; padding-bottom: 96px; overflow-y: auto;
        }
        .video-area::-webkit-scrollbar { width: 3px; }
        .video-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

        /* ── Video tile ── */
        .tile {
          position: relative; background: #0c0f1c; border-radius: 18px; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.07);
          transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        .tile:hover { transform: scale(1.012); border-color: rgba(255,255,255,0.14); }
        .tile.speaking {
          border-color: rgba(0,229,184,0.6);
          box-shadow: 0 0 0 2px rgba(0,229,184,0.15), 0 0 28px rgba(0,229,184,0.12);
        }

        /* Shimmer top edge */
        .tile::before {
          content: ''; position: absolute; top: 0; left: 15%; right: 15%;
          height: 1px; border-radius: 1px;
          background: linear-gradient(90deg, transparent, rgba(139,127,255,0.5), transparent);
          z-index: 2;
        }

        .tile-video { width: 100%; height: 100%; object-fit: cover; display: block; }

        .tile-avatar {
          width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
          background: linear-gradient(160deg, #0d1020, #0a0e1d);
        }
        .tile-initials {
          width: 64px; height: 64px; border-radius: 50%;
          background: linear-gradient(135deg, var(--c1), var(--c2));
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 800; letter-spacing: -0.5px;
          box-shadow: 0 0 0 3px rgba(139,127,255,0.2), 0 8px 24px rgba(139,127,255,0.2);
        }

        .tile-bar {
          position: absolute; bottom: 0; left: 0; right: 0;
          padding: 20px 14px 12px;
          background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%);
          display: flex; align-items: center; justify-content: space-between;
          z-index: 3;
        }
        .tile-name {
          display: flex; align-items: center; gap: 6px;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
          padding: 4px 10px; border-radius: 100px;
          font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.92);
          letter-spacing: 0.2px; border: 1px solid rgba(255,255,255,0.08);
        }
        .tile-crown { font-size: 10px; }
        .tile-icons { display: flex; gap: 4px; }
        .tile-icon {
          width: 26px; height: 26px; border-radius: 8px;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; border: 1px solid rgba(255,255,255,0.08);
        }

        /* ── Side panel ── */
        .panel {
          width: 310px; background: rgba(10,13,24,0.97);
          border-left: 1px solid var(--bd);
          display: flex; flex-direction: column; flex-shrink: 0;
          backdrop-filter: blur(24px);
          animation: slideInPanel 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes slideInPanel { from{transform:translateX(20px);opacity:0} to{transform:translateX(0);opacity:1} }

        .panel-hd {
          padding: 16px 20px 14px;
          border-bottom: 1px solid var(--bd);
          display: flex; align-items: center; justify-content: space-between;
        }
        .panel-title {
          font-size: 13px; font-weight: 700; letter-spacing: 1.5px;
          text-transform: uppercase; color: var(--muted);
        }
        .panel-x {
          width: 28px; height: 28px; border-radius: 8px; background: rgba(255,255,255,0.05);
          border: 1px solid var(--bd); color: var(--muted);
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; cursor: pointer; transition: all 0.2s; line-height: 1;
        }
        .panel-x:hover { background: rgba(255,255,255,0.1); color: var(--txt); border-color: var(--bdh); }

        /* Participants */
        .p-list { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
        .p-list::-webkit-scrollbar { width: 3px; }
        .p-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 2px; }
        .p-row {
          display: flex; align-items: center; gap: 10px; padding: 9px 10px;
          border-radius: 12px; transition: background 0.15s; cursor: default;
        }
        .p-row:hover { background: rgba(255,255,255,0.04); }
        .p-av {
          width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, var(--c1), var(--c2));
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 800;
          box-shadow: 0 0 0 2px rgba(139,127,255,0.18);
        }
        .p-info { flex: 1; min-width: 0; }
        .p-name-text { font-size: 13px; font-weight: 600; color: var(--txt); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .p-sub { font-size: 11px; color: var(--faint); margin-top: 1px; }
        .p-badges { display: flex; gap: 3px; }
        .p-ico { font-size: 13px; }
        .btn-kick {
          background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
          color: #fca5a5; font-size: 11px; font-weight: 600; padding: 4px 10px;
          border-radius: 8px; cursor: pointer; font-family: 'Cabinet Grotesk', sans-serif;
          transition: all 0.2s; white-space: nowrap;
        }
        .btn-kick:hover { background: rgba(239,68,68,0.18); border-color: rgba(239,68,68,0.35); }

        /* Chat */
        .chat-msgs {
          flex: 1; overflow-y: auto; padding: 16px; display: flex;
          flex-direction: column; gap: 14px;
        }
        .chat-msgs::-webkit-scrollbar { width: 3px; }
        .chat-msgs::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.07); border-radius: 2px; }
        .chat-empty { color: var(--faint); font-size: 13px; text-align: center; margin-top: 48px; line-height: 1.6; }
        .chat-empty-icon { font-size: 28px; margin-bottom: 10px; opacity: 0.4; }

        .msg-bubble { animation: msgIn 0.2s ease; }
        @keyframes msgIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .msg-meta { display: flex; align-items: baseline; gap: 6px; margin-bottom: 4px; }
        .msg-sender {
          font-size: 11px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.8px; color: var(--c1);
        }
        .msg-time { font-size: 10px; color: var(--faint); }
        .msg-text {
          font-size: 13.5px; color: rgba(232,236,247,0.78); line-height: 1.55;
          background: rgba(255,255,255,0.03); border: 1px solid var(--bd);
          padding: 8px 12px; border-radius: 4px 12px 12px 12px;
        }

        .chat-input-wrap {
          padding: 12px; border-top: 1px solid var(--bd);
          display: flex; gap: 8px; align-items: flex-end;
        }
        .chat-inp {
          flex: 1; padding: 10px 14px; min-height: 40px;
          background: rgba(255,255,255,0.04); border: 1px solid var(--bd);
          border-radius: 12px; color: var(--txt);
          font-family: 'Cabinet Grotesk', sans-serif; font-size: 13px; font-weight: 400;
          outline: none; transition: all 0.2s; resize: none;
        }
        .chat-inp:focus { border-color: rgba(139,127,255,0.4); background: rgba(139,127,255,0.04); box-shadow: 0 0 0 3px rgba(139,127,255,0.06); }
        .chat-inp::placeholder { color: var(--faint); }
        .btn-send {
          width: 40px; height: 40px; border-radius: 12px; border: none; cursor: pointer;
          background: linear-gradient(135deg, var(--c1), #5748d4); color: #fff;
          display: flex; align-items: center; justify-content: center; font-size: 16px;
          transition: all 0.2s; flex-shrink: 0;
        }
        .btn-send:hover { box-shadow: 0 6px 18px rgba(139,127,255,0.4); transform: translateY(-1px); }

        /* ── Controls bar ── */
        .controls {
          position: fixed; bottom: 0; left: 0; right: 0; height: 80px;
          background: rgba(6,8,16,0.95); backdrop-filter: blur(28px); -webkit-backdrop-filter: blur(28px);
          border-top: 1px solid var(--bd);
          display: flex; align-items: center; justify-content: center; gap: 8px;
          z-index: 20; padding: 0 20px;
        }

        /* Ctrl group separators */
        .ctrl-sep { width: 1px; height: 30px; background: var(--bd); margin: 0 4px; }

        .ctrl {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          padding: 9px 18px; min-width: 68px;
          background: rgba(255,255,255,0.05); border: 1px solid var(--bd);
          color: var(--muted); border-radius: 14px; cursor: pointer;
          font-family: 'Cabinet Grotesk', sans-serif; font-size: 11px; font-weight: 600;
          transition: all 0.2s; position: relative; letter-spacing: 0.2px;
          text-transform: uppercase;
        }
        .ctrl:hover { background: rgba(255,255,255,0.09); border-color: var(--bdh); color: var(--txt); transform: translateY(-1px); }
        .ctrl:active { transform: translateY(0); }

        .ctrl.off {
          background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.25);
          color: #fca5a5;
        }
        .ctrl.off:hover { background: rgba(239,68,68,0.18); }

        .ctrl.on-v {
          background: rgba(139,127,255,0.12); border-color: rgba(139,127,255,0.28);
          color: var(--c1);
        }
        .ctrl.on-t {
          background: rgba(0,229,184,0.08); border-color: rgba(0,229,184,0.22);
          color: var(--c2);
        }
        .ctrl.on-y {
          background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.25);
          color: #fcd34d;
        }

        .ctrl-ico { font-size: 18px; line-height: 1; }

        .ctrl-badge {
          position: absolute; top: 6px; right: 6px;
          width: 8px; height: 8px; border-radius: 50%; background: #ef4444;
          border: 1.5px solid #060810;
          animation: badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes badgePop { from{transform:scale(0)} to{transform:scale(1)} }

        .ctrl-leave {
          display: flex; flex-direction: column; align-items: center; gap: 3px;
          padding: 9px 22px; min-width: 68px;
          background: rgba(220,38,38,0.15); border: 1px solid rgba(220,38,38,0.3);
          color: #fca5a5; border-radius: 14px; cursor: pointer;
          font-family: 'Cabinet Grotesk', sans-serif; font-size: 11px; font-weight: 700;
          transition: all 0.2s; letter-spacing: 0.3px; text-transform: uppercase;
        }
        .ctrl-leave:hover {
          background: rgba(220,38,38,0.28); border-color: rgba(220,38,38,0.5);
          transform: translateY(-1px); box-shadow: 0 6px 18px rgba(220,38,38,0.2);
        }
        .ctrl-leave:active { transform: translateY(0); }

        /* ── End confirm overlay ── */
        .overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 200;
          animation: fadeOverlay 0.2s ease;
        }
        @keyframes fadeOverlay { from{opacity:0} to{opacity:1} }

        .confirm {
          background: linear-gradient(160deg, #0e1120, #0b0e1c);
          border: 1px solid var(--bdh); border-radius: 24px; padding: 36px 32px;
          width: 360px; text-align: center;
          box-shadow: 0 24px 64px rgba(0,0,0,0.6);
          animation: confirmPop 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes confirmPop { from{transform:scale(0.9);opacity:0} to{transform:scale(1);opacity:1} }

        .confirm::before {
          content: ''; display: block; width: 48px; height: 48px; border-radius: 14px;
          background: rgba(220,38,38,0.15); border: 1px solid rgba(220,38,38,0.25);
          margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;
          font-size: 22px; line-height: 48px; text-align: center;
        }

        .confirm-icon {
          width: 52px; height: 52px; border-radius: 16px;
          background: rgba(220,38,38,0.12); border: 1px solid rgba(220,38,38,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 24px; margin: 0 auto 20px;
        }

        .confirm-h {
          font-size: 20px; font-weight: 800; letter-spacing: -0.4px; margin-bottom: 8px;
        }
        .confirm-p {
          font-size: 13px; color: var(--muted); line-height: 1.65; margin-bottom: 28px;
        }
        .confirm-row { display: flex; gap: 10px; margin-bottom: 10px; }
        .btn-cancel {
          flex: 1; padding: 13px; background: rgba(255,255,255,0.05); border: 1px solid var(--bd);
          color: var(--muted); border-radius: 12px; cursor: pointer;
          font-family: 'Cabinet Grotesk', sans-serif; font-size: 13px; font-weight: 600;
          transition: all 0.2s;
        }
        .btn-cancel:hover { background: rgba(255,255,255,0.09); color: var(--txt); border-color: var(--bdh); }
        .btn-end-all {
          flex: 1; padding: 13px; background: rgba(220,38,38,0.18); border: 1px solid rgba(220,38,38,0.35);
          color: #fca5a5; border-radius: 12px; cursor: pointer;
          font-family: 'Cabinet Grotesk', sans-serif; font-size: 13px; font-weight: 700;
          transition: all 0.2s;
        }
        .btn-end-all:hover { background: rgba(220,38,38,0.3); box-shadow: 0 4px 16px rgba(220,38,38,0.2); }
        .btn-leave-solo {
          width: 100%; padding: 12px; background: none;
          border: 1px solid rgba(255,255,255,0.07); color: var(--faint);
          border-radius: 12px; cursor: pointer;
          font-family: 'Cabinet Grotesk', sans-serif; font-size: 13px; font-weight: 500;
          transition: all 0.2s;
        }
        .btn-leave-solo:hover { border-color: var(--bdh); color: var(--muted); }
      `}</style>

      <div className="rm">
        {/* Ambient orbs */}
        <div className="rm-orb rm-orb-a" />
        <div className="rm-orb rm-orb-b" />

        {/* Toast */}
        {notification && <div className="notif">{notification.msg}</div>}

        {/* End confirm */}
        {showEndConfirm && (
          <div className="overlay" onClick={() => setShowEndConfirm(false)}>
            <div className="confirm" onClick={e => e.stopPropagation()}>
              <div className="confirm-icon">📵</div>
              <div className="confirm-h">Leave meeting?</div>
              <div className="confirm-p">
                {isHost
                  ? 'End the meeting for everyone, or quietly slip out on your own.'
                  : "You'll leave the room. Others will stay connected."}
              </div>
              <div className="confirm-row">
                <button className="btn-cancel" onClick={() => setShowEndConfirm(false)}>Stay</button>
                {isHost && (
                  <button className="btn-end-all" onClick={endMeeting}>End for all</button>
                )}
              </div>
              <button className="btn-leave-solo" onClick={leaveRoom}>Just leave quietly</button>
            </div>
          </div>
        )}

        {/* Topbar */}
        <div className="topbar">
          <div className="tl">
            <span className="brand">Connect<b>Meet</b></span>
            <div className="tb-sep" />
            <div className="live-dot-wrap">
              <div className="live-dot" />
              <span className="live-text">Live</span>
            </div>
            <span className="timer-chip">{formatTime(duration)}</span>
            <div className="count-chip">
              <div className="count-dot" />
              <span>{totalParticipants}</span>
            </div>
            {isHost && <div className="badge badge-host">👑 Host</div>}
            {isScreenSharing && <div className="badge badge-share">🖥 Sharing</div>}
          </div>
          <div className="tr">
            <div className="room-pill" onClick={copyRoomId}>
              <span>{copied ? '✓ Copied!' : `ID: ${roomId}`}</span>
              <span className="room-pill-icon">📋</span>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="main">

          {/* Video grid */}
          <div className="video-area">
            {/* Local tile */}
            <div className="tile" style={{
              width: peers.length === 0 ? 'min(720px,100%)' : 'calc(50% - 6px)',
              aspectRatio: '16/9'
            }}>
              {isVideoOff && !isScreenSharing ? (
                <div className="tile-avatar">
                  <div className="tile-initials">{user.name.slice(0,2).toUpperCase()}</div>
                </div>
              ) : (
                <video ref={localVideoRef} autoPlay muted playsInline className="tile-video" />
              )}
              <div className="tile-bar">
                <div className="tile-name">
                  {hostSocketId === socketRef.current?.id && <span className="tile-crown">👑</span>}
                  {user.name} (You)
                </div>
                <div className="tile-icons">
                  {isMuted && <div className="tile-icon">🔇</div>}
                  {isHandRaised && <div className="tile-icon">✋</div>}
                </div>
              </div>
            </div>

            {/* Remote tiles */}
            {peers.map(({ socketId, userName }) => (
              <RemoteVideo
                key={socketId}
                socketId={socketId}
                userName={userName}
                stream={remoteStreams[socketId]}
                isHost={socketId === hostSocketId}
                handRaised={raisedHands.has(socketId)}
              />
            ))}
          </div>

          {/* Participants panel */}
          {panel === 'participants' && (
            <div className="panel">
              <div className="panel-hd">
                <span className="panel-title">People · {totalParticipants}</span>
                <button className="panel-x" onClick={() => setPanel(null)}>×</button>
              </div>
              <div className="p-list">
                <div className="p-row">
                  <div className="p-av">{user.name.slice(0,2).toUpperCase()}</div>
                  <div className="p-info">
                    <div className="p-name-text">{user.name}</div>
                    <div className="p-sub">You{hostSocketId === socketRef.current?.id ? ' · Host' : ''}</div>
                  </div>
                  <div className="p-badges">
                    {hostSocketId === socketRef.current?.id && <span className="p-ico">👑</span>}
                    {isMuted && <span className="p-ico">🔇</span>}
                    {isHandRaised && <span className="p-ico">✋</span>}
                  </div>
                </div>
                {peers.map(({ socketId, userName }) => (
                  <div className="p-row" key={socketId}>
                    <div className="p-av">{userName.slice(0,2).toUpperCase()}</div>
                    <div className="p-info">
                      <div className="p-name-text">{userName}</div>
                      <div className="p-sub">{socketId === hostSocketId ? 'Host' : 'Participant'}</div>
                    </div>
                    <div className="p-badges">
                      {socketId === hostSocketId && <span className="p-ico">👑</span>}
                      {raisedHands.has(socketId) && <span className="p-ico">✋</span>}
                    </div>
                    {isHost && socketId !== hostSocketId && (
                      <button className="btn-kick" onClick={() => removeParticipant(socketId)}>Remove</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chat panel */}
          {panel === 'chat' && (
            <div className="panel">
              <div className="panel-hd">
                <span className="panel-title">Chat</span>
                <button className="panel-x" onClick={() => setPanel(null)}>×</button>
              </div>
              <div className="chat-msgs">
                {messages.length === 0 && (
                  <div className="chat-empty">
                    <div className="chat-empty-icon">💬</div>
                    No messages yet.<br />Say hello to the room!
                  </div>
                )}
                {messages.map((m, i) => (
                  <div className="msg-bubble" key={i}>
                    <div className="msg-meta">
                      <span className="msg-sender">{m.senderName}</span>
                      <span className="msg-time">
                        {new Date(m.sentAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                      </span>
                    </div>
                    <div className="msg-text">{m.content}</div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>
              <div className="chat-input-wrap">
                <input
                  className="chat-inp"
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Message the room…"
                />
                <button className="btn-send" onClick={sendMessage}>↑</button>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="controls">
          <button className={`ctrl ${isMuted ? 'off' : ''}`} onClick={toggleMute}>
            <span className="ctrl-ico">{isMuted ? '🔇' : '🎤'}</span>
            {isMuted ? 'Unmute' : 'Mute'}
          </button>

          <button className={`ctrl ${isVideoOff ? 'off' : ''}`} onClick={toggleVideo}>
            <span className="ctrl-ico">{isVideoOff ? '📵' : '📹'}</span>
            {isVideoOff ? 'Start' : 'Video'}
          </button>

          <div className="ctrl-sep" />

          <button className={`ctrl ${isScreenSharing ? 'on-t' : ''}`} onClick={toggleScreenShare}>
            <span className="ctrl-ico">🖥</span>
            {isScreenSharing ? 'Stop' : 'Share'}
          </button>

          <button className={`ctrl ${isHandRaised ? 'on-y' : ''}`} onClick={toggleHand}>
            <span className="ctrl-ico">✋</span>
            {isHandRaised ? 'Lower' : 'Hand'}
          </button>

          <div className="ctrl-sep" />

          <button
            className={`ctrl ${panel === 'participants' ? 'on-v' : ''}`}
            onClick={() => togglePanel('participants')}
          >
            <span className="ctrl-ico">👥</span>
            People
          </button>

          <button
            className={`ctrl ${panel === 'chat' ? 'on-v' : ''}`}
            onClick={() => togglePanel('chat')}
          >
            {unreadIndicator && panel !== 'chat' && <div className="ctrl-badge" />}
            <span className="ctrl-ico">💬</span>
            Chat
          </button>

          <div className="ctrl-sep" />

          <button className="ctrl-leave" onClick={() => setShowEndConfirm(true)}>
            <span className="ctrl-ico">📵</span>
            Leave
          </button>
        </div>
      </div>
    </>
  )
}

function RemoteVideo({ socketId, userName, stream, isHost, handRaised }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream
  }, [stream])

  return (
    <div className="tile" style={{width:'calc(50% - 6px)',aspectRatio:'16/9'}}>
      {stream ? (
        <video ref={ref} autoPlay playsInline className="tile-video" />
      ) : (
        <div className="tile-avatar">
          <div className="tile-initials">{userName.slice(0,2).toUpperCase()}</div>
        </div>
      )}
      <div className="tile-bar">
        <div className="tile-name">
          {isHost && <span className="tile-crown">👑</span>}
          {userName}
        </div>
        <div className="tile-icons">
          {handRaised && <div className="tile-icon">✋</div>}
        </div>
      </div>
    </div>
  )
}
