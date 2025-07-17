import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"

const prisma = new PrismaClient()

export class UserController {
  // Listar todos os usuários (apenas admin)
  async getAllUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
          // Não incluir password por segurança
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      res.json({ users })
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Criar usuário (apenas admin)
  async createUser(req: Request, res: Response) {
    try {
      const { name, email, password, role, phone, address } = req.body

      // Validações básicas
      if (!name || !email || !password) {
        return res.status(400).json({ 
          error: "Nome, email e senha são obrigatórios" 
        })
      }

      // Verificar se o email já existe
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return res.status(400).json({ 
          error: "Email já está em uso" 
        })
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10)

      // Criar usuário
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role === 'admin' ? 'ADMIN' : 'CUSTOMER',
          phone,
          addresses: address ? {
            create: {
              ...address,
              isDefault: true
            }
          } : undefined
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          addresses: true,
          createdAt: true,
          updatedAt: true
        }
      })

      res.status(201).json({ 
        message: "Usuário criado com sucesso",
        user 
      })
    } catch (error) {
      console.error("Erro ao criar usuário:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Buscar usuário por ID
  async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params

      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
          addresses: true,
          orders: {
            select: {
              id: true,
              total: true,
              status: true,
              createdAt: true
            }
          }
        }
      })

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" })
      }

      res.json({ user })
    } catch (error) {
      console.error("Erro ao buscar usuário:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Atualizar usuário
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { name, email, role, phone, address } = req.body

      // Verificar se o usuário existe
      const existingUser = await prisma.user.findUnique({
        where: { id }
      })

      if (!existingUser) {
        return res.status(404).json({ error: "Usuário não encontrado" })
      }

      // Atualizar usuário
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          name,
          email,
          role: role === 'admin' ? 'ADMIN' : 'CUSTOMER',
          phone,
          addresses: address ? {
            create: {
              ...address,
              isDefault: true
            }
          } : undefined
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          addresses: true,
          createdAt: true,
          updatedAt: true
        }
      })

      res.json({ user: updatedUser })
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Deletar usuário
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params

      // Verificar se o usuário existe
      const existingUser = await prisma.user.findUnique({
        where: { id }
      })

      if (!existingUser) {
        return res.status(404).json({ error: "Usuário não encontrado" })
      }

      // Verificar se o usuário tem pedidos
      const userOrders = await prisma.order.findMany({
        where: { userId: id }
      })

      if (userOrders.length > 0) {
        return res.status(400).json({ 
          error: "Não é possível deletar usuário com pedidos associados" 
        })
      }

      // Deletar usuário
      await prisma.user.delete({
        where: { id }
      })

      res.json({ message: "Usuário deletado com sucesso" })
    } catch (error) {
      console.error("Erro ao deletar usuário:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Estatísticas de usuários
  async getUserStats(req: Request, res: Response) {
    try {
      const totalUsers = await prisma.user.count()
      const adminUsers = await prisma.user.count({
        where: { role: 'ADMIN' }
      })
      const regularUsers = await prisma.user.count({
        where: { role: 'CUSTOMER' }
      })

      res.json({
        stats: {
          total: totalUsers,
          admins: adminUsers,
          users: regularUsers
        }
      })
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }
} 