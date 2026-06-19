import { Router } from 'express'
import { listCategories, createCategory } from '../controllers/categories.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'

const router = Router()

router.use(authMiddleware)
router.get('/', asyncHandler(listCategories))
router.post('/', asyncHandler(createCategory))

export default router
