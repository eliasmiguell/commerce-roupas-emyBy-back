import { Router } from "express"
import { OrderController } from "../controllers/OrderController"
import { authMiddleware } from "../middleware/auth"

const router = Router()
const orderController = new OrderController()

// Todas as rotas de pedidos requerem autenticação
router.use(authMiddleware)

router.get("/", orderController.getOrders)
router.post("/", orderController.createOrder)
router.get("/:id", orderController.getOrderById)

export default router
