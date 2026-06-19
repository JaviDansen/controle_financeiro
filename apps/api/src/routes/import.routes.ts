import { Router } from 'express'
import { importExtract } from '../controllers/import.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'

const router = Router()

router.use(authMiddleware)
router.post('/extract', asyncHandler(importExtract))

export default router
