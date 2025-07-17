import type { Response } from "express"
import { prisma } from "../lib/prisma"
import type { AuthRequest } from "../middleware/auth"

export class AddressController {
  // Listar endereços do usuário
  async getAddresses(req: AuthRequest, res: Response) {
    try {
      const addresses = await prisma.address.findMany({
        where: { userId: req.user!.userId },
        orderBy: { isDefault: "desc" },
      })
      res.json({ addresses })
    } catch (error) {
      console.error("Erro ao listar endereços:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Buscar endereço por ID
  async getAddressById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const address = await prisma.address.findFirst({
        where: {
          id,
          userId: req.user!.userId,
        },
      })
      if (!address) {
        return res.status(404).json({ error: "Endereço não encontrado" })
      }
      res.json({ address })
    } catch (error) {
      console.error("Erro ao buscar endereço:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Criar endereço
  async createAddress(req: AuthRequest, res: Response) {
    try {
      const { street, city, state, zipCode, phone, isDefault = false } = req.body

      // Validações básicas
      if (!street || !city || !state || !zipCode) {
        return res.status(400).json({
          error: "Rua, cidade, estado e CEP são obrigatórios",
        })
      }

      // Se for endereço padrão, remover outros endereços padrão
      if (isDefault) {
        await prisma.address.updateMany({
          where: {
            userId: req.user!.userId,
            isDefault: true,
          },
          data: { isDefault: false },
        })
      }

      const address = await prisma.address.create({
        data: {
          userId: req.user!.userId,
          street,
          number: "1", // Número padrão
          neighborhood: "Centro", // Bairro padrão
          city,
          state,
          zipCode,
          isDefault,
        },
      })

      res.status(201).json({
        message: "Endereço criado com sucesso",
        address,
      })
    } catch (error) {
      console.error("Erro ao criar endereço:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Atualizar endereço
  async updateAddress(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const { street, city, state, zipCode, isDefault } = req.body

      // Verificar se o endereço pertence ao usuário
      const existingAddress = await prisma.address.findFirst({
        where: {
          id,
          userId: req.user!.userId,
        },
      })

      if (!existingAddress) {
        return res.status(404).json({ error: "Endereço não encontrado" })
      }

      // Se for endereço padrão, remover outros endereços padrão
      if (isDefault) {
        await prisma.address.updateMany({
          where: {
            userId: req.user!.userId,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        })
      }

      const address = await prisma.address.update({
        where: { id },
        data: {
          street,
          city,
          state,
          zipCode,
          isDefault,
        },
      })

      res.json({
        message: "Endereço atualizado com sucesso",
        address,
      })
    } catch (error) {
      console.error("Erro ao atualizar endereço:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Deletar endereço
  async deleteAddress(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      // Verificar se o endereço pertence ao usuário
      const address = await prisma.address.findFirst({
        where: {
          id,
          userId: req.user!.userId,
        },
      })

      if (!address) {
        return res.status(404).json({ error: "Endereço não encontrado" })
      }

      await prisma.address.delete({
        where: { id },
      })

      res.json({ message: "Endereço deletado com sucesso" })
    } catch (error) {
      console.error("Erro ao deletar endereço:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Definir endereço como padrão
  async setDefaultAddress(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      // Verificar se o endereço pertence ao usuário
      const address = await prisma.address.findFirst({
        where: {
          id,
          userId: req.user!.userId,
        },
      })

      if (!address) {
        return res.status(404).json({ error: "Endereço não encontrado" })
      }

      // Remover outros endereços padrão
      await prisma.address.updateMany({
        where: {
          userId: req.user!.userId,
          isDefault: true,
        },
        data: { isDefault: false },
      })

      // Definir este endereço como padrão
      const updatedAddress = await prisma.address.update({
        where: { id },
        data: { isDefault: true },
      })

      res.json({
        message: "Endereço definido como padrão",
        address: updatedAddress,
      })
    } catch (error) {
      console.error("Erro ao definir endereço padrão:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }
} 