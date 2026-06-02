import express from 'express'
import isLogin from '../middleware/islogin.js'
import { getCorrentChatters, getUserBySearch, saveFcmToken, getUserProfile, updateProfilePic, updateUserProfile } from '../routecontrollers/userhandlerControler.js'
const router = express.Router()

router.get('/search',isLogin,getUserBySearch);
router.put('/update', isLogin, updateUserProfile);

router.get('/currentchatters',isLogin,getCorrentChatters)

router.get('/:id', isLogin, getUserProfile);

router.post('/update-profile-pic', isLogin, updateProfilePic);

router.post('/save-token', isLogin, saveFcmToken);

export default router