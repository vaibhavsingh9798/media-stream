const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2')

const userSchema= new  mongoose.Schema(
    {
    username:{
        type: String,
        required : true,
        unique: true,
        lowercase : true,
        trim: true,
        index : true 
    },
    email:{
        type: String,
        required : true,
        unique: true,
        lowercase : true,
        trim: true,
    },
    fullname:{
        type: String,
        trim: true,
        index: true
    },
    avatar:{
        type: String,
    },
    coverImage:{
        type: String,
    },
    watchHistory : [
        {type : mongoose.Schema.Types.ObjectId , ref: 'Video'}
    ],

    password : {
        type :String,
        required : [true,'Password is required']


    },
    refreshToken:{
        type : String
    }

},
{
   timestamps : true  
}
)

userSchema.pre("save", async function(next){
     if(!this.isModified("password")) return next() ;

    this.password = await  bcrypt.hash(this.password,10)
  
      next();
})

userSchema.methods.isPasswordCorrect = async function(password){
     return await bcrypt.compare(password,this.password)
}

userSchema.methods.genrateAccessToken = function(){
    
 return   jwt.sign(
        {
            _id:this._id,
            username: this.username,
            email: this.email,
            fullname : this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }

    )
}

userSchema.methods.genrateRefreshToken = function(){
     
  return  jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }

    )
}




const User= mongoose.model('User',userSchema) 

module.exports = User;