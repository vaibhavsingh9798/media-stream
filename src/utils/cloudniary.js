const cloudinary = require('cloudinary').v2
const fs = require('fs')

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDNIARY_CLOUD_NAME, 
        api_key: process.env.CLOUDNIARY_API_KEY, 
        api_secret: process.env.CLOUDNIARY_API_SECRET ,
        timeout: 60000
    });


    const uploadOnCloudniary = async (localFilePath) =>{
        try{
            if(!localFilePath) return null ;

            const cloudinaryResponse = await cloudinary.uploader.upload(localFilePath,{
                 resource_type: 'auto' 
            })
            console.log('file uploaded...', cloudinaryResponse.url)
            return cloudinaryResponse;

        }catch(error){
            console.log('cloudniary error.....',error)
            fs.unlinkSync(localFilePath) // removes a file or symbolic link.
        }
    }
    
    
    module.exports = uploadOnCloudniary;