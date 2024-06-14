const jwt = require('jsonwebtoken')
const ApiError = require("../utils/ApiError")
const User = require('../models/user.models')


const verifyJWT = async (req,res,next) =>{
    try{
   
        const token = req.cookies?.accessToken  || req.header('Authorization')?.replace('Bearer ',"")

        console.log("token...",token)
        if(!token){
            throw new ApiError(401,'Unauthorized request')
        }

        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")
        req.user = user
         next()
    }catch(error){
       throw new ApiError(401,'Unauthorized user')
    }
}

module.exports = verifyJWT ;  