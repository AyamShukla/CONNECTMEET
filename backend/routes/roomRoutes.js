const express = require('express')
const router = express.Router()
const { createRoom, getRoom } = require('../controllers/roomController')
const { protect } = require('../middleware/authMiddleware')

router.post('/', protect, createRoom)
router.get('/:roomId', getRoom)

module.exports = router