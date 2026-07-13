import { Router } from 'express'
import { importExtract, importValidate, importGallery, importServeImage, importConfirm, importDeleteImage } from '../controllers/import.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/async-handler'

const router = Router()

router.use(authMiddleware)
router.post('/validate', asyncHandler(importValidate))
router.post('/extract', asyncHandler(importExtract))
router.get('/gallery', asyncHandler(importGallery))
router.get('/image/:imageId', asyncHandler(importServeImage))
router.delete('/image/:imageId', asyncHandler(importDeleteImage))
router.post('/confirm', asyncHandler(importConfirm))

export default router
