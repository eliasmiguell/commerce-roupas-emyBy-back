import type { Response } from "express"
import { prisma } from "../lib/prisma"
import type { AuthRequest } from "../middleware/auth"

export class CartController {
  // Listar itens do carrinho
  async getCartItems(req: AuthRequest, res: Response) {
    try {
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: req.user!.userId },
        include: {
          product: {
            include: {
              category: true,
            },
          },
          variant: true,
        },
      })

      const total = cartItems.reduce((sum, item) => {
        return sum + Number(item.product.price) * item.quantity
      }, 0)

      res.json({
        items: cartItems,
        total: Number(total.toFixed(2)),
        count: cartItems.length,
      })
    } catch (error) {
      console.error("Erro ao listar carrinho:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Adicionar item ao carrinho
  async addToCart(req: AuthRequest, res: Response) {
    try {
      const { productId, variantId, quantity = 1 } = req.body

      // Validações básicas
      if (!productId) {
        return res.status(400).json({ error: "ID do produto é obrigatório" })
      }

      if (quantity <= 0) {
        return res.status(400).json({ error: "Quantidade deve ser maior que zero" })
      }

      // Verificar se o produto existe e está ativo
      const product = await prisma.product.findUnique({
        where: { id: productId, isActive: true },
      })

      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado ou inativo" })
      }

      // Se variantId foi fornecido, verificar se existe
      if (variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: variantId },
        })

        if (!variant) {
          return res.status(404).json({ error: "Variação do produto não encontrada" })
        }

        // Verificar estoque
        if (variant.stock < quantity) {
          return res.status(400).json({
            error: `Estoque insuficiente. Disponível: ${variant.stock}`,
          })
        }
      }

      // Verificar se já existe no carrinho
      const existingItem = await prisma.cartItem.findUnique({
        where: {
          userId_productId_variantId: {
            userId: req.user!.userId,
            productId,
            variantId,
          },
        },
      })

      let cartItem

      if (existingItem) {
        // Atualizar quantidade
        cartItem = await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
          include: {
            product: true,
            variant: true,
          },
        })
      } else {
        // Criar novo item
        cartItem = await prisma.cartItem.create({
          data: {
            userId: req.user!.userId,
            productId,
            variantId,
            quantity,
          },
          include: {
            product: true,
            variant: true,
          },
        })
      }

      res.status(201).json({
        message: "Item adicionado ao carrinho",
        item: cartItem,
      })
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Atualizar quantidade do item
  async updateCartItem(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const { quantity } = req.body

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          error: "Quantidade deve ser maior que zero",
        })
      }

      // Verificar se o item pertence ao usuário
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          id,
          userId: req.user!.userId,
        },
        include: {
          variant: true,
        },
      })

      if (!existingItem) {
        return res.status(404).json({ error: "Item não encontrado no carrinho" })
      }

      // Verificar estoque se houver variação
      if (existingItem.variant && existingItem.variant.stock < quantity) {
        return res.status(400).json({
          error: `Estoque insuficiente. Disponível: ${existingItem.variant.stock}`,
        })
      }

      const cartItem = await prisma.cartItem.update({
        where: { id },
        data: { quantity },
        include: {
          product: true,
          variant: true,
        },
      })

      res.json({
        message: "Quantidade atualizada",
        item: cartItem,
      })
    } catch (error) {
      console.error("Erro ao atualizar carrinho:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Remover item do carrinho
  async removeCartItem(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      // Verificar se o item existe e pertence ao usuário
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          id,
          userId: req.user!.userId,
        },
      })

      if (!existingItem) {
        return res.status(404).json({ error: "Item não encontrado no carrinho" })
      }

      await prisma.cartItem.delete({
        where: { id },
      })

      res.json({ message: "Item removido do carrinho" })
    } catch (error) {
      console.error("Erro ao remover do carrinho:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Limpar carrinho
  async clearCart(req: AuthRequest, res: Response) {
    try {
      await prisma.cartItem.deleteMany({
        where: { userId: req.user!.userId },
      })

      res.json({ message: "Carrinho limpo com sucesso" })
    } catch (error) {
      console.error("Erro ao limpar carrinho:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }
}
