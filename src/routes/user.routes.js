const {Router} = require('express');
const upload = require('../middlewares/multer.middleware.js')
const { registerUser, loginUser, logoutUser, refreshAccessToken } = require('../controllers/user.controller.js');
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

module.exports = router;