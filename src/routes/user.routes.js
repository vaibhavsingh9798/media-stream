const {Router} = require('express');
const upload = require('../middlewares/multer.middleware.js')
const { registerUser, loginUser, logoutUser, refreshAccessToken, getUserChannelProfile, changeCurrentPassword, updateAccountDetails, updateUseravatar, updateUserCoverImage, getWatchHistory } = require('../controllers/user.controller.js');
const verifyJWT = require('../middlewares/auth.middleware.js');

const router = Router()

router.route('/register').post(
    upload.fields([
        {
        name : "avatar",
        maxCount: 1,
        },{
         name: 'coverImage',
         maxCount: 1
        }
    ])   ,
    registerUser
)

router.route('/login').post(loginUser)

router.route('/logout').post(verifyJWT , logoutUser)
router.route('/refresh-token').post(refreshAccessToken) 
router.route('/change-password').patch(verifyJWT, changeCurrentPassword)
router.route('/update-account').patch(verifyJWT, updateAccountDetails )
router.route('/change-avatar').patch(verifyJWT,updateUseravatar)
router.route('/chnage-coverImage').patch(verifyJWT,updateUserCoverImage)
router.route('/getUserChannnelProfile').post(verifyJWT,getUserChannelProfile)
router.route('/channel/:username').get(verifyJWT,getUserChannelProfile)
router.route('/history').get(verifyJWT,getWatchHistory) 

    
module.exports = router;