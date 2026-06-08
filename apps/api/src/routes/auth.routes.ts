import { Router } from 'express'
import { register, login, logout, forgotPassword, resetPassword, redirectResetPassword } from '../controllers/auth.controller'
import { asyncHandler } from '../middlewares/async-handler'

const router = Router()

router.post('/register', asyncHandler(register))
router.post('/login', asyncHandler(login))
router.post('/logout', asyncHandler(logout))
router.post('/forgot-password', asyncHandler(forgotPassword))
router.get('/reset-password', asyncHandler(redirectResetPassword))
router.post('/reset-password', asyncHandler(resetPassword))

export default router
