import type { Response } from "express"
import { prisma } from "../lib/prisma"
import type { AuthRequest } from "../middleware/auth"

export class OrderController {
  // Listar pedidos do usuário
  async getOrders(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 10 } = req.query
      const skip = (Number(page) - 1) * Number(limit)

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: { userId: req.user!.userId },
          include: {
            orderItems: {
              include: {
                product: true,
                variant: true,
              },
            },
            address: true,
            payment: true,
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: Number(limit),
        }),
        prisma.order.count({
          where: { userId: req.user!.userId },
        }),
      ])

      res.json({
        orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      })
    } catch (error) {
      console.error("Erro ao listar pedidos:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Criar pedido
  async createOrder(req: AuthRequest, res: Response) {
    try {
      const { addressId, paymentMethod } = req.body

      // Validações básicas
      if (!addressId || !paymentMethod) {
        return res.status(400).json({
          error: "Endereço e método de pagamento são obrigatórios",
        })
      }

      // Verificar se o endereço pertence ao usuário
      const address = await prisma.address.findFirst({
        where: {
          id: addressId,
          userId: req.user!.userId,
        },
      })

      if (!address) {
        return res.status(404).json({ error: "Endereço não encontrado" })
      }

      // Buscar itens do carrinho
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: req.user!.userId },
        include: {
          product: true,
          variant: true,
        },
      })

      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Carrinho vazio" })
      }

      // Verificar estoque dos itens
      for (const item of cartItems) {
        if (item.variant && item.variant.stock < item.quantity) {
          return res.status(400).json({
            error: `Estoque insuficiente para ${item.product.name}. Disponível: ${item.variant.stock}`,
          })
        }
      }

      // Calcular total
      const total = cartItems.reduce((sum, item) => {
        return sum + Number(item.product.price) * item.quantity
      }, 0)

      // Gerar número do pedido
      const orderNumber = `EMY${Date.now()}`

      // Criar pedido em transação
      const order = await prisma.$transaction(async (tx) => {
        // Criar o pedido
        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            userId: req.user!.userId,
            addressId,
            total,
            orderItems: {
              create: cartItems.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: item.product.price,
              })),
            },
            payment: {
              create: {
                amount: total,
                method: paymentMethod,
              },
            },
          },
          include: {
            orderItems: {
              include: {
                product: true,
                variant: true,
              },
            },
            address: true,
            payment: true,
          },
        })

        // Atualizar estoque
        for (const item of cartItems) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            })
          }
        }

        // Limpar carrinho
        await tx.cartItem.deleteMany({
          where: { userId: req.user!.userId },
        })

        return newOrder
      })

      res.status(201).json({
        message: "Pedido criado com sucesso",
        order,
      })
    } catch (error) {
      console.error("Erro ao criar pedido:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Buscar pedido por ID
  async getOrderById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      const order = await prisma.order.findFirst({
        where: {
          id,
          userId: req.user!.userId,
        },
        include: {
          orderItems: {
            include: {
              product: true,
              variant: true,
            },
          },
          address: true,
          payment: true,
        },
      })

      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" })
      }

      res.json(order)
    } catch (error) {
      console.error("Erro ao buscar pedido:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // ===== MÉTODOS PARA ADMIN =====

  // Listar todos os pedidos (admin)
  async getAllOrders(req: AuthRequest, res: Response) {
    try {
      const orders = await prisma.order.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          orderItems: {
            include: {
              product: true,
              variant: true,
            },
          },
          address: true,
          payment: true,
        },
        orderBy: { createdAt: "desc" },
      })
      res.json({ orders })
    } catch (error) {
      console.error("Erro ao listar pedidos:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Buscar pedido por ID (admin)
  async getOrderByIdAdmin(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          orderItems: {
            include: {
              product: true,
              variant: true,
            },
          },
          address: true,
          payment: true,
        },
      })
      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" })
      }
      res.json({ order })
    } catch (error) {
      console.error("Erro ao buscar pedido:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Criar pedido (admin)
  async createOrderAdmin(req: AuthRequest, res: Response) {
    try {
      const { userId, status, items, customerInfo } = req.body
      if (!items || items.length === 0) {
        return res.status(400).json({ error: "Itens são obrigatórios" })
      }

      let addressId = null
      let finalUserId = userId

      // Se tem userId, verificar se usuário existe e buscar endereço
      if (userId && userId !== "guest") {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) {
          return res.status(404).json({ error: "Usuário não encontrado" })
        }
        
        const address = await prisma.address.findFirst({ where: { userId, isDefault: true } })
        if (!address) {
          return res.status(400).json({ error: "Usuário não possui endereço padrão cadastrado" })
        }
        addressId = address.id
      } else {
        // Pedido sem usuário (guest) - userId será null
        finalUserId = null
      }

      const total = items.reduce((sum: number, item: any) => sum + (Number(item.price) * item.quantity), 0)
      const orderNumber = `EMY${Date.now()}`

      const orderData: any = {
        orderNumber,
        status: status || "PENDING",
        total,
        orderItems: {
          create: items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      }

      // Adicionar userId apenas se não for guest
      if (finalUserId) {
        orderData.userId = finalUserId
        orderData.addressId = addressId
      } else {
        // Para pedidos guest, armazenar informações do cliente em campos adicionais
        orderData.customerName = customerInfo?.name
        orderData.customerEmail = customerInfo?.email
        orderData.customerPhone = customerInfo?.phone
        orderData.customerAddress = customerInfo?.address
        orderData.customerCity = customerInfo?.city
        orderData.customerZipCode = customerInfo?.zipCode
      }

      const order = await prisma.order.create({
        data: orderData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          orderItems: {
            include: {
              product: true,
              variant: true,
            },
          },
          address: true,
        },
      })
      
      res.status(201).json({ message: "Pedido criado com sucesso", order })
    } catch (error) {
      console.error("Erro ao criar pedido:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Atualizar pedido (admin)
  async updateOrder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const { status } = req.body
      const order = await prisma.order.update({
        where: { id },
        data: { status },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          orderItems: {
            include: {
              product: true,
              variant: true,
            },
          },
          address: true,
        },
      })
      res.json({ message: "Pedido atualizado com sucesso", order })
    } catch (error) {
      console.error("Erro ao atualizar pedido:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Deletar pedido (admin)
  async deleteOrder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const order = await prisma.order.findUnique({ where: { id } })
      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" })
      }
      await prisma.order.delete({ where: { id } })
      res.json({ message: "Pedido deletado com sucesso" })
    } catch (error) {
      console.error("Erro ao deletar pedido:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }
}
