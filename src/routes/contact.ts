import express from "express"
import { ContactController } from "../controllers/ContactController"

const router = express.Router()

// Rota para enviar email de contato
router.post("/send", ContactController.sendEmail)

export default router 