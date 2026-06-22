import { Router } from 'express'
import { importExtract, importValidate, importHistory, importReanalyze } from '../controllers/import.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'

const router = Router()

router.use(authMiddleware)
router.post('/validate', asyncHandler(importValidate))
router.post('/extract', asyncHandler(importExtract))
router.get('/history', asyncHandler(importHistory))
router.post('/reanalyze/:imageId', asyncHandler(importReanalyze))

export default router
