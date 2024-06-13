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
  
    const avtarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath 

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0  ){
        coverImageLocalPath  = req.files.coverImage[0].path
  
    }

    if(!avtarLocalPath){
        throw new ApiError(400,"Avtar file is required ")
    }

    const avatar = await uploadOnCloudniary(avtarLocalPath) 
    const coverImage = await uploadOnCloudniary(coverImageLocalPath)
     
 
    if(!avatar){
        throw new ApiError(400,"Avtar file is required ")
    }

   const user = await User.create({
    username : username.toLowerCase(),
    fullname,
    email,
    password,
    avatar: avatar.url,
    coverImage : coverImage.url || ""         
   
   })

   const createdUser = await User.findById(user._id).select("-password -refreshToken")

   if(!createdUser){
    throw new ApiError(500,"Something went wrong while registring the user")
   }

   return res.status(201).json(new ApiResponse(200,createdUser,"User registred successfully")) 
})

const genrateAccessAndRefreshTokens = async (userId) =>{

    try{
        const user = await User.findById(userId)
        let accessToken =  user.genrateAccessToken()
        let refreshToken = user.genrateRefreshToken() 

        user.refreshToken = refreshToken ;
        await user.save({ validateBeforeSave : true})

        return {accessToken,refreshToken}

    }catch(error){
  throw new ApiError(500,'Something went wrong while genrating access and refresh token')
    }
}

exports.loginUser = asyncHnadler(async(req,res) =>{

      const {username,email,password} = req.body 
       
      if(username || email){
        throw new ApiError(400,'username or email is required')
      }
    
      const user = await User.findOne({
        $or: [{username},{email}]
      })
    
      if(!user){
        throw new ApiError(404,'User does not exist')
    }

    const isPasswordValid = user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,'Invalid user credentials')
    }

    const {accessToken,refreshToken} = await genrateAccessAndRefreshTokens(user._id)
   
    const loggedInUser = User.findById(user._id)
                              .select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
           .cookie('accessToken',accessToken,options)
           .cookie('refreshToken',refreshToken,options)
           .json(new ApiResponse(
            200,
            {user : loggedInUser, accessToken, refreshToken},
            'User logged In Successfully'
           ))
  
})



exports.logoutUser = asyncHnadler(async(req,res) =>{
   await User.findByIdAndUpdate(req.user._id,{
        $set: { refreshToken : undefined}
    },{new:true}) // new true return updated , bydefault give before updated
    
     const options = {
        httpOnly : true,
        secure : true
     }

     return res.status(200)
            .clearCookie('accessToken',options)
            .clearCookie('refreshToken',options)
            .json(new ApiResponse(200,{},'User logged out'))
})