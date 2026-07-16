import { Router } from 'express'
import { createGoal, deleteGoal, getGoalById, listGoals, updateGoal } from '../controllers/goals.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'

const router = Router()

router.use(authMiddleware)
router.get('/', asyncHandler(listGoals))
router.post('/', asyncHandler(createGoal))
router.get('/:id', asyncHandler(getGoalById))
router.patch('/:id', asyncHandler(updateGoal))
router.delete('/:id', asyncHandler(deleteGoal))

export default router
