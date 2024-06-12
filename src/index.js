const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()

const connectDB = require("./db/index")
const userRouter = require('./routes/user.routes.js')

const app = express()

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static('public'))
app.use(cookieParser())


// routes
 app.use('/api/v1/users',userRouter)

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8001,()=>{
        console.log(`server is runing at port ${process.env.PORT}`)
    })
})
.catch((err) => console.log('mongodb connection failed'))

