import { Router } from 'express'
import { createCard, deleteCard, listCards, updateCard } from '../controllers/cards.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'

const router = Router()

router.use(authMiddleware)
router.get('/', asyncHandler(listCards))
router.post('/', asyncHandler(createCard))
router.put('/:id', asyncHandler(updateCard))
router.delete('/:id', asyncHandler(deleteCard))

export default router
