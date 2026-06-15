const mongoose = require('mongoose')

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://ayamshukla13_db_user:nahipata123@cluster0.vkiczlx.mongodb.net/connectmeet?retryWrites=true&w=majority'
  console.log('ENV CHECK - MONGODB_URI starts with:', uri.substring(0, 20))
  try {
    const conn = await mongoose.connect(uri)
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB
