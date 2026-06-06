// rooms = { roomId: { hostSocketId, participants: { socketId: { userId, userName } } } }
const rooms = {}

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id)

    // ── Join room ──────────────────────────────────────────
    socket.on('join-room', ({ roomId, userId, userName }) => {
      socket.join(roomId)

      if (!rooms[roomId]) {
        rooms[roomId] = { hostSocketId: socket.id, participants: {} }
      }

      rooms[roomId].participants[socket.id] = { userId, userName }

      // Tell existing participants a new user joined
      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        userId,
        userName
      })

      // Send new user the list of existing participants + who is host
      const existingParticipants = Object.entries(rooms[roomId].participants)
        .filter(([id]) => id !== socket.id)
        .map(([socketId, data]) => ({ socketId, ...data }))

      socket.emit('existing-participants', existingParticipants)
      socket.emit('host-info', { hostSocketId: rooms[roomId].hostSocketId })

      // Broadcast updated participant list to whole room
      io.to(roomId).emit('participants-update', {
        participants: Object.entries(rooms[roomId].participants).map(
          ([socketId, data]) => ({ socketId, ...data })
        ),
        hostSocketId: rooms[roomId].hostSocketId
      })
    })

    // ── WebRTC Signaling ───────────────────────────────────
    socket.on('send-offer', ({ to, offer }) => {
      io.to(to).emit('receive-offer', { from: socket.id, offer })
    })

    socket.on('send-answer', ({ to, answer }) => {
      io.to(to).emit('receive-answer', { from: socket.id, answer })
    })

    socket.on('send-ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('receive-ice-candidate', { from: socket.id, candidate })
    })

    // ── Chat ───────────────────────────────────────────────
    socket.on('send-message', ({ roomId, senderName, content }) => {
      io.to(roomId).emit('receive-message', {
        senderName,
        content,
        sentAt: new Date().toISOString()
      })
    })

    // ── Media state ────────────────────────────────────────
    socket.on('toggle-audio', ({ roomId, isMuted }) => {
      socket.to(roomId).emit('participant-audio-changed', {
        socketId: socket.id, isMuted
      })
    })

    socket.on('toggle-video', ({ roomId, isVideoOff }) => {
      socket.to(roomId).emit('participant-video-changed', {
        socketId: socket.id, isVideoOff
      })
    })

    // ── Screen share state ─────────────────────────────────
    socket.on('screen-share-started', ({ roomId }) => {
      socket.to(roomId).emit('user-screen-sharing', { socketId: socket.id })
    })

    socket.on('screen-share-stopped', ({ roomId }) => {
      socket.to(roomId).emit('user-stopped-screen-sharing', { socketId: socket.id })
    })

    // ── Host: remove participant ───────────────────────────
    socket.on('remove-participant', ({ roomId, targetSocketId }) => {
      if (rooms[roomId]?.hostSocketId === socket.id) {
        io.to(targetSocketId).emit('you-were-removed')
      }
    })

    // ── Host: end meeting for all ──────────────────────────
    socket.on('end-meeting', ({ roomId }) => {
      if (rooms[roomId]?.hostSocketId === socket.id) {
        io.to(roomId).emit('meeting-ended')
        delete rooms[roomId]
      }
    })

    // ── Raise hand ─────────────────────────────────────────
    socket.on('raise-hand', ({ roomId, userName }) => {
      socket.to(roomId).emit('hand-raised', { socketId: socket.id, userName })
    })

    socket.on('lower-hand', ({ roomId }) => {
      socket.to(roomId).emit('hand-lowered', { socketId: socket.id })
    })

    // ── Disconnect ─────────────────────────────────────────
    socket.on('disconnect', () => {
      for (const roomId in rooms) {
        if (rooms[roomId].participants[socket.id]) {
          delete rooms[roomId].participants[socket.id]
          socket.to(roomId).emit('user-left', { socketId: socket.id })

          // If host left, assign new host
          if (rooms[roomId].hostSocketId === socket.id) {
            const remaining = Object.keys(rooms[roomId].participants)
            if (remaining.length > 0) {
              rooms[roomId].hostSocketId = remaining[0]
              io.to(roomId).emit('host-changed', { hostSocketId: remaining[0] })
            }
          }

          if (Object.keys(rooms[roomId].participants).length === 0) {
            delete rooms[roomId]
          } else {
            io.to(roomId).emit('participants-update', {
              participants: Object.entries(rooms[roomId].participants).map(
                ([socketId, data]) => ({ socketId, ...data })
              ),
              hostSocketId: rooms[roomId].hostSocketId
            })
          }
          break
        }
      }
    })
  })
}

module.exports = socketHandler
