import express from "express"
import cors from "cors"
import dotenv from "dotenv"

// Importar rotas
import authRoutes from "./routes/auth"
import productRoutes from "./routes/products"
import cartRoutes from "./routes/cart"
import orderRoutes from "./routes/orders"
import categoryRoutes from "./routes/categories"
import uploadRoutes from "./routes/upload"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8001

// Middlewares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rotas
app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/upload", uploadRoutes)

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
