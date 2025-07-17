import { Router } from "express"
import { AuthController } from "../controllers/AuthController"
import { authMiddleware } from "../middleware/auth"

const router = Router()
const authController = new AuthController()

// Rotas de autenticação
router.post("/register", authController.register)
router.post("/login", authController.login)
router.get("/profile", authMiddleware, authController.getProfile)
router.get("/me", authMiddleware, authController.getProfile)
router.put("/profile", authMiddleware, authController.updateProfile)

export default router
