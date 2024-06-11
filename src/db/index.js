const mongoose = require('mongoose')
const DB_NAME = require("../constants.js")

const connectDB = async () =>{

    try{
 
        console.log('uri.......',`${process.env.MONGODB_URI}/${DB_NAME}`)
      const  connectionInstance  = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
      console.log(`\n mongodb connected , DB_HOST : ${connectionInstance.connection.host}`)

    }catch(error){
      console.log(`mongo connection error`,error);
      process.exit(1)
    }
}

module.exports = connectDB;