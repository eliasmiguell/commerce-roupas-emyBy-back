import type { Request, Response } from "express"
import { prisma } from "../lib/prisma"
import type { AuthRequest } from "../middleware/auth"

export class CategoryController {
  // Listar categorias (público)
  async getCategories(req: Request, res: Response) {
    try {
      const categories = await prisma.category.findMany({
        include: {
          _count: {
            select: {
              products: {
                where: {
                  isActive: true,
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      })

      res.json(categories)
    } catch (error) {
      console.error("Erro ao listar categorias:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Buscar categoria por ID (público)
  async getCategoryById(req: Request, res: Response) {
    try {
      const { id } = req.params

      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          products: {
            where: { isActive: true },
            include: {
              variants: true,
            },
          },
          _count: {
            select: {
              products: true,
            },
          },
        },
      })

      if (!category) {
        return res.status(404).json({ error: "Categoria não encontrada" })
      }

      res.json({ category })
    } catch (error) {
      console.error("Erro ao buscar categoria:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Buscar categoria por slug (público)
  async getCategoryBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params

      const category = await prisma.category.findUnique({
        where: { slug },
        include: {
          products: {
            where: { isActive: true },
            include: {
              variants: true,
            },
          },
        },
      })

      if (!category) {
        return res.status(404).json({ error: "Categoria não encontrada" })
      }

      res.json(category)
    } catch (error) {
      console.error("Erro ao buscar categoria:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Criar categoria (admin)
  async createCategory(req: AuthRequest, res: Response) {
    try {
      const { name, description, slug } = req.body

      if (!name || !slug) {
        return res.status(400).json({
          error: "Nome e slug são obrigatórios",
        })
      }

      // Verificar se já existe categoria com esse slug
      const existingCategory = await prisma.category.findUnique({
        where: { slug },
      })

      if (existingCategory) {
        return res.status(400).json({
          error: "Já existe uma categoria com este slug",
        })
      }

      const category = await prisma.category.create({
        data: {
          name,
          description,
          slug,
        },
      })

      res.status(201).json({
        message: "Categoria criada com sucesso",
        category,
      })
    } catch (error) {
      console.error("Erro ao criar categoria:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Atualizar categoria (admin)
  async updateCategory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params
      const { name, description, slug } = req.body

      const category = await prisma.category.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(slug && { slug }),
        },
      })

      res.json({
        message: "Categoria atualizada com sucesso",
        category,
      })
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }

  // Deletar categoria (admin)
  async deleteCategory(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params

      // Verificar se há produtos nesta categoria
      const productsCount = await prisma.product.count({
        where: { categoryId: id },
      })

      if (productsCount > 0) {
        return res.status(400).json({
          error: "Não é possível deletar categoria com produtos associados",
        })
      }

      await prisma.category.delete({
        where: { id },
      })

      res.json({ message: "Categoria deletada com sucesso" })
    } catch (error) {
      console.error("Erro ao deletar categoria:", error)
      res.status(500).json({ error: "Erro interno do servidor" })
    }
  }
}
