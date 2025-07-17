import type { Request, Response } from "express"
import { prisma } from "../lib/prisma"
import { hashPassword, authenticateUser } from "../lib/auth"
import type { AuthRequest } from "../middleware/auth"

export class AuthController {
  // Registro de usuário
  async register(req: Request, res: Response) {
    try {
      const { name, email, password, phone } = req.body

      // Validações básicas
      if (!name || !email || !password) {
        return res.status(400).json({
          error: "Nome, email e senha são obrigatórios",
        })
      }

      // Verificar se o usuário já existe
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return res.status(400).json({
          error: "Usuário já existe com este email",
        })
      }

      // Hash da senha
      const hashedPassword = await hashPassword(password)

      // Criar usuário
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      })

      res.status(201).json({
        message: "Usuário criado com sucesso",
        user,
      })
    } catch (error) {
      console.error("Erro no registro:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Login
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body

      // Validações básicas
      if (!email || !password) {
        return res.status(400).json({
          error: "Email e senha são obrigatórios",
        })
      }

      const result = await authenticateUser(email, password)

      res.json({
        message: "Login realizado com sucesso",
        ...result,
      })
    } catch (error) {
      console.error("Erro no login:", error)
      res.status(401).json({ error: (error as Error).message })
    }
  }

  // Perfil do usuário
  async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      })

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" })
      }

      res.json(user)
    } catch (error) {
      console.error("Erro ao buscar perfil:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Atualizar perfil
  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const { name, phone } = req.body

      if (!name) {
        return res.status(400).json({ error: "Nome é obrigatório" })
      }

      const user = await prisma.user.update({
        where: { id: req.user!.userId },
        data: { name, phone },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      })

      res.json({
        message: "Perfil atualizado com sucesso",
        user,
      })
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }
}
