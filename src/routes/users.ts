import express from "express"
import { UserController } from "../controllers/UserController"
import { authMiddleware } from "../middleware/auth"

const router = express.Router()
const userController = new UserController()

// Todas as rotas requerem autenticação
router.use(authMiddleware)

// Listar todos os usuários (apenas admin)
router.get("/", userController.getAllUsers)

// Criar usuário (apenas admin)
router.post("/", userController.createUser)

// Buscar usuário por ID
router.get("/:id", userController.getUserById)

// Atualizar usuário
router.put("/:id", userController.updateUser)

// Deletar usuário
router.delete("/:id", userController.deleteUser)

// Estatísticas de usuários
router.get("/stats/overview", userController.getUserStats)

export default router 