import { Router } from "express"
import { CategoryController } from "../controllers/CategoryController"
import { authMiddleware, adminMiddleware } from "../middleware/auth"

const router = Router()
const categoryController = new CategoryController()

// Rotas públicas
router.get("/", categoryController.getCategories)
router.get("/id/:id", categoryController.getCategoryById)
router.get("/:slug", categoryController.getCategoryBySlug)

// Rotas administrativas
router.post("/", authMiddleware, adminMiddleware, categoryController.createCategory)
router.put("/:id", authMiddleware, adminMiddleware, categoryController.updateCategory)
router.delete("/:id", authMiddleware, adminMiddleware, categoryController.deleteCategory)

export default router
