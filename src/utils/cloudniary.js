const { v2 } = require('cloudinary')
const fs = require('fs')



    // Configuration
    v2.config({ 
        cloud_name: process.env.CLOUDNIARY_CLOUD_NAME, 
        api_key: process.env.CLOUDNIARY_API_KEY, 
        api_secret: process.env.CLOUDNIARY_API_SECRET 
    });


    const uploadOnCloudniary = async (localFilePath) =>{
        try{

            if(!localFilePath) return null ;

            const cloudinaryResponse = await v2.uploader.upload(localFilePath,{
                resource_type: 'auto'
            })

            console.log('file uploaded', cloudinaryResponse.url)
            return cloudinaryResponse;

        }catch(error){
            fs.unlinkSync(localFilePath) // removes a file or symbolic link.
        }
    }
    
    
    module.exports = uploadOnCloudniary;