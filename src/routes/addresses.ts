import { Router } from "express"
import { AddressController } from "../controllers/AddressController"
import { authMiddleware } from "../middleware/auth"

const router = Router()
const addressController = new AddressController()

// Todas as rotas de endereços requerem autenticação
router.use(authMiddleware)

router.get("/", addressController.getAddresses)
router.post("/", addressController.createAddress)
router.get("/:id", addressController.getAddressById)
router.put("/:id", addressController.updateAddress)
router.delete("/:id", addressController.deleteAddress)

export default router 