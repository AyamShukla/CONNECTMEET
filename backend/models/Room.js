const mongoose = require('mongoose')

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'My Meeting' },
  isActive: { type: Boolean, default: true },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    displayName: String,
    joinedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true })

module.exports = mongoose.model('Room', roomSchema)