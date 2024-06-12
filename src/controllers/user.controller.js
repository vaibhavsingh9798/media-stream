const asyncHnadler = require('../utils/asyncHnadler.js')
const ApiError = require('../utils/ApiError.js')
const User = require('../models/user.models.js')
const uploadOnCloudniary = require('../utils/cloudniary.js')
const ApiResponse = require('../utils/ApiResponse.js')
exports.registerUser = asyncHnadler(async (req,res) =>{ 
     
    const {username,email,fullname,password} = req.body;
    
    if( [username,fullname,email,password].some((field) => field?.trim() === "")){
        throw new ApiError(400,"All field are required")
    }

    const exitedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(exitedUser){
        throw new ApiError(409, "User already exist with username or email")
    }

    const avtarLocalPath = req.files?.avtar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avtarLocalPath){
        throw new ApiError(400,"Avtar file is required")
    }

    const avtar = await uploadOnCloudniary(avtarLocalPath)
    const coverImage = await uploadOnCloudniary(coverImageLocalPath)

    if(!avtar){
        throw new ApiError(400,"Avtar file is required")
    }

   const user = await User.create({
    username : username.toLowerCase(),
    fullname,
    email,
    password,
    avtar: avtar.url,
    coverImage: coverImage?.url || "",
   })

   const createdUser = await User.findById(user._id).select("-password -refreshToken")

   if(!createdUser){
    throw new ApiError(500,"Something went wrong while registring the user")
   }

   return res.status(201).json(new ApiResponse(200,createdUser,"User registred successfully")) 
})