import type { Request, Response } from "express"
import { prisma } from "../lib/prisma"
import type { AuthRequest } from "../middleware/auth"

export class ProductController {
  // Listar produtos (público)
  async getProducts(req: Request, res: Response) {
    try {
      const { category, page = 1, limit = 12, search } = req.query

      const skip = (Number(page) - 1) * Number(limit)

      const where = {
        isActive: true,
        ...(category && { category: { slug: category as string } }),
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: "insensitive" as any } },
            { description: { contains: search as string, mode: "insensitive" as any } },
          ],
        }),
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
            variants: true,
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: "desc" },
        }),
        prisma.product.count({ where }),
      ])

      res.json({
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      })
    } catch (error) {
      console.error("Erro ao listar produtos:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Listar produtos para admin (inclui inativos)
  async getProductsAdmin(req: AuthRequest, res: Response) {
    try {
      const { page = 1, limit = 20, search } = req.query

      const skip = (Number(page) - 1) * Number(limit)

      const where: any = {
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: "insensitive" } },
            { description: { contains: search as string, mode: "insensitive" } },
            { category: { name: { contains: search as string, mode: "insensitive" } } },
          ],
        }),
      }

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: {
            category: true,
            variants: true,
          },
          skip,
          take: Number(limit),
          orderBy: { createdAt: "desc" },
        }),
        prisma.product.count({ where }),
      ])

      res.json({
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      })
    } catch (error) {
      console.error("Erro ao listar produtos para admin:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Buscar produto por ID (público)
  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          variants: true,
        },
      })

      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado" })
      }

      res.json(product)
    } catch (error) {
      console.error("Erro ao buscar produto:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Criar produto (admin)
  async createProduct(req: AuthRequest, res: Response) {
    try {
      const { name, description, price, categoryId, imageUrl, variants } = req.body

      console.log("Dados recebidos para criar produto:", {
        name,
        description,
        price,
        categoryId,
        imageUrl,
        variants
      })

      // Validações básicas
      if (!name || !price || !categoryId) {
        return res.status(400).json({
          error: "Nome, preço e categoria são obrigatórios",
        })
      }

      // Verificar se a categoria existe
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      })

      if (!category) {
        return res.status(404).json({ error: "Categoria não encontrada" })
      }

      const product = await prisma.product.create({
        data: {
          name,
          description,
          price: Number(price),
          categoryId,
          imageUrl,
          variants: {
            create: variants || [],
          },
        },
        include: {
          category: true,
          variants: true,
        },
      })

      res.status(201).json({
        message: "Produto criado com sucesso",
        product,
      })
    } catch (error) {
      console.error("Erro ao criar produto:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Atualizar produto (admin)
  async updateProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const { name, description, price, categoryId, imageUrl, isActive } = req.body

      // Verificar se o produto existe
      const existingProduct = await prisma.product.findUnique({
        where: { id },
      })

      if (!existingProduct) {
        return res.status(404).json({ error: "Produto não encontrado" })
      }

      const product = await prisma.product.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(price && { price: Number(price) }),
          ...(categoryId && { categoryId }),
          ...(imageUrl !== undefined && { imageUrl }),
          ...(isActive !== undefined && { isActive }),
        },
        include: {
          category: true,
          variants: true,
        },
      })

      res.json({
        message: "Produto atualizado com sucesso",
        product,
      })
    } catch (error) {
      console.error("Erro ao atualizar produto:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Deletar produto (admin)
  async deleteProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      // Verificar se o produto existe
      const existingProduct = await prisma.product.findUnique({
        where: { id },
      })

      if (!existingProduct) {
        return res.status(404).json({ error: "Produto não encontrado" })
      }

      await prisma.product.delete({
        where: { id },
      })

      res.json({ message: "Produto deletado com sucesso" })
    } catch (error) {
      console.error("Erro ao deletar produto:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }
}
