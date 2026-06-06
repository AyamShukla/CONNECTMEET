const Room = require('../models/Room')
const { v4: uuidv4 } = require('uuid')

const createRoom = async (req, res) => {
  try {
    const roomId = uuidv4().split('-').slice(0, 3).join('-')
    const room = await Room.create({
      roomId,
      hostId: req.user._id,
      title: req.body.title || 'My Meeting'
    })
    res.status(201).json({ roomId: room.roomId })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

const getRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId })
    if (!room) return res.status(404).json({ message: 'Room not found' })
    res.json(room)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

module.exports = { createRoom, getRoom }