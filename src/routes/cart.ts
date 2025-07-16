import { Router } from "express"
import { CartController } from "../controllers/CartController"
import { authMiddleware } from "../middleware/auth"

const router = Router()
const cartController = new CartController()

// Todas as rotas do carrinho requerem autenticação
router.use(authMiddleware)

router.get("/", cartController.getCartItems)
router.post("/add", cartController.addToCart)
router.put("/:id", cartController.updateCartItem)
router.delete("/:id", cartController.removeCartItem)
router.delete("/", cartController.clearCart)

export default router
