import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
// import { imageOptimizer } from "./middleware/imageOptimizer"

// Importar rotas
import authRoutes from "./routes/auth"
import productRoutes from "./routes/products"
import cartRoutes from "./routes/cart"
import orderRoutes from "./routes/orders"
import categoryRoutes from "./routes/categories"
import uploadRoutes from "./routes/upload"
import userRoutes from "./routes/users"
import addressRoutes from "./routes/addresses"
import contactRoutes from "./routes/contact"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8001

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://emy-by.vercel.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Servir arquivos estáticos
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads"), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
}))
app.use("/public", express.static(path.join(__dirname, "../public")))

// Middleware de otimização de imagens (após os arquivos estáticos)
// app.use("/uploads", imageOptimizer)

// Rotas
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/api/users", userRoutes)
app.use("/api/addresses", addressRoutes)
app.use("/api/contact", contactRoutes)

// Rota de teste
app.get("/api/health", (req, res) => {
  res.json({ message: "API Emy-by funcionando!" })
})

// Middleware de erro global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ error: "Algo deu errado!" })
})

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
})

export default app
