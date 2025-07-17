import { Router } from "express"
import { OrderController } from "../controllers/OrderController"
import { authMiddleware } from "../middleware/auth"
import { PaymentController } from "../controllers/PaymentController"

const router = Router()
const orderController = new OrderController()
const paymentController = new PaymentController()

// Todas as rotas de pedidos requerem autenticação
router.use(authMiddleware)

router.get("/", orderController.getOrders)
router.post("/", orderController.createOrder)
router.get("/:id", orderController.getOrderById)

// Rotas para admin
router.get("/admin/all", orderController.getAllOrders)
router.post("/admin", orderController.createOrderAdmin)
router.get("/admin/:id", orderController.getOrderByIdAdmin)
router.put("/admin/:id", orderController.updateOrder)
router.delete("/admin/:id", orderController.deleteOrder)

// Rotas de pagamento para pedidos
router.post("/admin/:id/payment", paymentController.createPayment)
router.post("/admin/payment/:paymentId/process", paymentController.processPayment)
router.get("/admin/payment/:id", paymentController.getPaymentById)
router.get("/admin/:id/payment", paymentController.getPaymentByOrder)
router.get("/admin/payments", paymentController.getAllPayments)
router.post("/admin/payment/:id/cancel", paymentController.cancelPayment)

export default router
