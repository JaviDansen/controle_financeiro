import { Router } from 'express'
import { createCard, listCards } from '../controllers/cards.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()

router.use(authMiddleware)
router.get('/', listCards)
router.post('/', createCard)

export default router
