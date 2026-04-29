import express from 'express'
import isLogin from '../middleware/islogin.js'
import { getCorrentChatters, getUserBySearch } from '../routecontrollers/userhandlerControler.js'
const router = express.Router()

router.get('/search',isLogin,getUserBySearch);

router.get('/currentchatters',isLogin,getCorrentChatters)

export default router