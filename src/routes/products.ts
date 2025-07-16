import { Router } from "express"
import { ProductController } from "../controllers/ProductController"
import { authMiddleware, adminMiddleware } from "../middleware/auth"

const router = Router()
const productController = new ProductController()

// Rotas públicas
router.get("/", productController.getProducts)
router.get("/:id", productController.getProductById)

// Rotas administrativas
router.get("/admin", authMiddleware, adminMiddleware, productController.getProductsAdmin)
router.post("/", authMiddleware, adminMiddleware, productController.createProduct)
router.put("/:id", authMiddleware, adminMiddleware, productController.updateProduct)
router.patch("/:id", authMiddleware, adminMiddleware, productController.updateProduct)
router.delete("/:id", authMiddleware, adminMiddleware, productController.deleteProduct)

export default router
