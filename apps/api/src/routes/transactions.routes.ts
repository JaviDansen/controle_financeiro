import { Router } from 'express'
import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from '../controllers/transactions.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'

const router = Router()

router.use(authMiddleware)
router.get('/', asyncHandler(listTransactions))
router.post('/', asyncHandler(createTransaction))
router.put('/:id', asyncHandler(updateTransaction))
router.delete('/:id', asyncHandler(deleteTransaction))

export default router
