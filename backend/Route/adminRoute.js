import express from 'express'
import isLogin from '../middleware/islogin.js'
import { getAdminStats, getAllUsersAdmin } from '../routecontrollers/adminController.js'

const router = express.Router()

router.get('/stats', isLogin, getAdminStats);
router.get('/users', isLogin, getAllUsersAdmin);

export default router;
