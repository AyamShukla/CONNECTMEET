const mongoose = require('mongoose')

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://ayamshukla13_db_user:nahipata123@cluster0.vkjszlx.mongodb.net/connectmeet?retryWrites=true&w=majority&appName=Cluster0'
  try {
    const conn = await mongoose.connect(uri)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB
