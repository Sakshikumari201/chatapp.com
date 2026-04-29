import express from "express"
import { getMessages, sendMessage } from "../routecontrollers/messageroutControler.js";
import isLogin from "../middleware/islogin.js";

const router=express.Router();

router.post('/send/:id', isLogin, sendMessage);
router.get('/:id', isLogin, getMessages);

export default router