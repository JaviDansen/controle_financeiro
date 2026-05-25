import { Router } from 'express'
import { createCard, listCards } from '../controllers/cards.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'

const router = Router()

router.use(authMiddleware)
router.get('/', asyncHandler(listCards))
router.post('/', asyncHandler(createCard))

export default router
