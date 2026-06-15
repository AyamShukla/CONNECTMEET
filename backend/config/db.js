const mongoose = require('mongoose')

const connectDB = async () => {
  console.log('ENV CHECK - MONGODB_URI starts with:', (process.env.MONGODB_URI || 'UNDEFINED').substring(0, 20))
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB
