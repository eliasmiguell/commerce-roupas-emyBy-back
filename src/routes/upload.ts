import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import { authMiddleware } from "../middleware/auth"
import type { AuthRequest } from "../middleware/auth"

const router = express.Router()

// Configurar multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../public/uploads")
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `product-${uniqueSuffix}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Verificar se é uma imagem
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Apenas imagens são permitidas"))
    }
  },
})

// Rota para upload de imagem (apenas admin)
router.post("/", authMiddleware, upload.single("image"), (req: AuthRequest, res) => {
  try {
    console.log("Upload iniciado")
    console.log("Headers:", req.headers)
    console.log("User:", req.user)
    console.log("File:", req.file)
    
    if (!req.file) {
      console.log("Nenhum arquivo recebido")
      return res.status(400).json({ error: "Nenhuma imagem foi enviada" })
    }

    // Verificar se o usuário é admin
    if (req.user?.role !== "ADMIN") {
      console.log("Usuário não é admin:", req.user?.role)
      return res.status(403).json({ error: "Acesso negado" })
    }

    // Retornar URL da imagem
    const imageUrl = `/uploads/${req.file.filename}`
    console.log("Upload bem-sucedido:", imageUrl)
    
    res.json({
      message: "Imagem enviada com sucesso",
      imageUrl,
      filename: req.file.filename,
    })
  } catch (error) {
    console.error("Erro no upload:", error)
    res.status(500).json({ error: "Erro interno do servidor" })
  }
})

// Rota para servir arquivos estáticos
router.use("/uploads", express.static(path.join(__dirname, "../../public/uploads")))

export default router 