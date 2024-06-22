const asyncHnadler = require('../utils/asyncHnadler.js')
const ApiError = require('../utils/ApiError.js')
const User = require('../models/user.models.js')
const uploadOnCloudniary = require('../utils/cloudniary.js')
const ApiResponse = require('../utils/ApiResponse.js')
const jwt = require('jsonwebtoken')
const { subscribe } = require('../routes/user.routes.js')
const { default: mongoose } = require('mongoose')

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
  
    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath 

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0  ){
        coverImageLocalPath  = req.files.coverImage[0].path
  
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file is required ")
    }

    const avatar = await uploadOnCloudniary(avatarLocalPath) 
    const coverImage = await uploadOnCloudniary(coverImageLocalPath)
     
 
    if(!avatar){
        throw new ApiError(400,"avatar file is required ")
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
        let accessToken =   user.genrateAccessToken()
        let refreshToken =  user.genrateRefreshToken() 

        user.refreshToken = refreshToken ;
        await user.save({ validateBeforeSave : false})

        return {accessToken,refreshToken}

    }catch(error){
  throw new ApiError(500,'Something went wrong while genrating access and refresh token')
    }
}

exports.loginUser = asyncHnadler(async(req,res) =>{

      const {username,email,password} = req.body 
      
       
      if( !(username || email)){
        throw new ApiError(400,'username or email is required')
      }
    
      const user = await User.findOne({
        $or: [{username},{email}]
      })
    
      if(!user){
        throw new ApiError(404,'User does not exist')
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,'Invalid user credentials')
    }

    const {accessToken,refreshToken} = await genrateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id)
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

exports.refreshAccessToken = asyncHnadler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Invalid refresh token")
    }

    try {
        const decodeToken  = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodeToken?._id)

        if(!user){
            throw new ApiError(401,'Refresh token is expired or used') 
        }
    
        if(user.refreshToken !== incomingRefreshToken){
            throw new ApiError(401,'Invalid refresh token')
        }
    
        const {accessToken,refreshToken} = genrateAccessAndRefreshTokens(user._id)
    
         const options = {
            httpOnly: true,
            secure : true
         }
        return res.status(200)
               .cookie('accessToken',accessToken,options)
               .cookie('refreshToken',refreshToken,options)
               .json(new ApiResponse(
                200,
                {accessToken,refreshToken},
                'Access token refreshed'
               )) 
    
    } catch (error) {
        throw new ApiError(401, error.message || 'Invalid refresh token')
    }
}) 

exports.changeCurrentPassword = asyncHnadler(async(req,res) =>{
     
    const {oldPassword,newPassword} = req.body

    
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,'Invalid old password')
    }

    user.password = newPassword 
    await user.save({validateBeforeSave : false})

    return res.status(200)
           .json(new ApiResponse(200,{},'Password changed successfully'))
})

exports.updateAccountDetails = asyncHnadler(async(req,res) =>{

    const {username,email} = req.body 

    if(!username || !email){
        throw new ApiError(400,'All fields are requred')
    }

    const user = await User.findByIdAndUpdate(req.user?.id,
        {
            $set: {username,email}
        },
        {new:true}).select("-password")

        return res.status(200)
               .json(new ApiResponse(
                200,
                user,
                'Account details updated successfully'
               ))
})

exports.updateUseravatar = asyncHnadler(async(req,res) =>{

    const avatarFilePath = req.file?.path

    if(!avatarFilePath){
        throw new ApiError(400,'avatar file is missing')
    }

    let avatar = await uploadOnCloudniary(avatarFilePath)

    if(!avatar.url){
        throw new ApiError(400,'Error while uploading on avatar')
    }

  const user =  await User.findByIdAndUpdate(req.user?.id,{
        $set: {avatar: avatar.url},
        
    },{new: true}).select('-password')
   
     return res.status(200)
            .json(new ApiResponse(
                200,
                user,
                'avatar updated successfully'
            ))
})

exports.updateUserCoverImage = asyncHnadler(async(req,res) =>{

    const coverImageFilePath = req.file?.path

    if(!coverImageFilePath){
        throw new ApiError(400,'Cover image  is missing')
    }

    let coverImage = await uploadOnCloudniary(coverImageFilePath)

    if(!coverImage.url){
        throw new ApiError(400,'Error while uploading on cover image')
    }

  const user =  await User.findByIdAndUpdate(req.user?.id,{
        $set: {coverImage: coverImage.url},
        
    },{new: true}).select('-password')
   
     return res.status(200)
            .json(new ApiResponse(
                200,
                user,
                'Cover image updated successfully'
            ))
})

exports.getUserChannelProfile = asyncHnadler(async(req,res) =>{

    const {username} = req.params

    if(!username){
        throw new ApiError(400,'username is missing')
    }

    const chnnel = await User.aggregate([
        {
            $match : {username : username?.toLowerCase()}
        },
        {
           $lookup : {
            from : "subscriptions",
            localField: "_id",
            foreignField : "channel",
            as : "subscribers"
           }  
        },
        {
             $lookup : {
                from : "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as : "subscribedTo"
             }
        },
        {
            $addFields : {
                subscribersCount : { $size : "$subscribers"},
                channelSubscripedToCount : { $size : "subscribedTo"},
                isSubscribed : { 
                    $cond : {
                        if : {$in : [req.user?._id ,"$subscribers.subscriber"]},
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            $project : {
                fullname : 1,
                username : 1,
                subscribersCount : 1,
                channelSubscripedToCount : 1,
                isSubscribed : 1,
                avatar : 1,
                coverImage : 1,
                email : 1,


            }
        }
    ])

    if(!chnnel?.length){
        throw new ApiError(404,"chnnel does not exists")
    }

    return res.status(200)
           .json(new ApiResponse(
            200,
            chnnel?.[0],
            'User channel featched successfully'

           ))
})

exports.getWatchHistory = asyncHnadler(async(req,res) =>{
     const user = User.aggregate([
        {
            $match:{
                _id : new mongoose.Types.ObjectId(req.user._id)
            },
            $lookup : {
                 from : 'videos',
                 foreignField : '_id',
                 localField : 'watchHistory',
                 as : 'watchHistory',
                 pipeline:[
                    {
                        $lookup :{
                             from : 'users',
                             foreignField:'_id',
                             localField:'owner',
                             as:'owner',
                             pipeline : [
                                {
                                    $project:{
                                        fullname : 1,
                                        username : 1,
                                        avatar : 1
                                    }
                                }
                             ]
                        }
                    },
                    {
                     $addFields : {
                      owner :{
                      $first : '$owner'
                    }
                    }
                    }

                 ]
            }
        }
     ])

     return res.status(200)
            .json(new ApiResponse(
            200,
            user[0].watchHistory,
            'Watch history fetched successfully'
            ))
})

