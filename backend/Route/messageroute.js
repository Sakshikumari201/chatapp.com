import express from "express"
import { getMessages, sendMessage, searchMessages, togglePinConversation, toggleArchiveConversation, createGroupChat, renameGroup, addToGroup, removeFromGroup } from "../routecontrollers/messageroutControler.js";
import isLogin from "../middleware/islogin.js";

const router=express.Router();

router.post('/send/:id', isLogin, sendMessage);
router.get('/search/:id', isLogin, searchMessages);
router.post('/pin/:id', isLogin, togglePinConversation);
router.post('/archive/:id', isLogin, toggleArchiveConversation);
router.post('/group', isLogin, createGroupChat);
router.put('/rename', isLogin, renameGroup);
router.put('/groupadd', isLogin, addToGroup);
router.put('/groupremove', isLogin, removeFromGroup);
router.get('/:id', isLogin, getMessages);

export default router