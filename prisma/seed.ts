import { PrismaClient } from "@prisma/client"
import { hashPassword } from "../src/lib/auth"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...")

  // Criar categorias usando upsert para evitar duplicatas
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: "Vestidos" },
      update: {},
      create: {
        name: "Vestidos",
        slug: "vestidos",
        description: "Vestidos elegantes e modernos",
      },
    }),
    prisma.category.upsert({
      where: { name: "Blusas" },
      update: {},
      create: {
        name: "Blusas",
        slug: "blusas",
        description: "Blusas casuais e sociais",
      },
    }),
    prisma.category.upsert({
      where: { name: "Saias" },
      update: {},
      create: {
        name: "Saias",
        slug: "saias",
        description: "Saias longas e midi",
      },
    }),
    prisma.category.upsert({
      where: { name: "Calças" },
      update: {},
      create: {
        name: "Calças",
        slug: "calcas",
        description: "Calças jeans e sociais",
      },
    }),
    prisma.category.upsert({
      where: { name: "Sapatos" },
      update: {},
      create: {
        name: "Sapatos",
        slug: "sapatos",
        description: "Sapatos para todas as ocasiões",
      },
    }),
    prisma.category.upsert({
      where: { name: "Tênis" },
      update: {},
      create: {
        name: "Tênis",
        slug: "tenis",
        description: "Tênis esportivos e casuais",
      },
    }),
    prisma.category.upsert({
      where: { name: "Sandálias" },
      update: {},
      create: {
        name: "Sandálias",
        slug: "sandalias",
        description: "Sandálias confortáveis",
      },
    }),
    prisma.category.upsert({
      where: { name: "Relógios" },
      update: {},
      create: {
        name: "Relógios",
        slug: "relogios",
        description: "Relógios elegantes",
      },
    }),
    prisma.category.upsert({
      where: { name: "Colares" },
      update: {},
      create: {
        name: "Colares",
        slug: "colares",
        description: "Colares e bijuterias",
      },
    }),
  ])

  // Criar usuário admin usando upsert
  const adminPassword = await hashPassword("admin123")
  const admin = await prisma.user.upsert({
    where: { email: "admin@emy-by.com" },
    update: {},
    create: {
      name: "Esterfanny",
      email: "admin@emy-by.com",
      password: adminPassword,
      role: "ADMIN",
      phone: "85992245116",
    },
  })

  // Criar produtos de exemplo
  const products = [
    {
      name: "Vestido Longo Florido",
      description: "Malha suede; Decote em V; Mangas princesa",
      price: 70.0,
      categoryId: categories[0].id,
      variants: [
        { size: "P", stock: 5 },
        { size: "M", stock: 3 },
      ],
    },
    {
      name: "Vestido Midi Lilás",
      description: "Lilás; Com babados na barra",
      price: 150.0,
      categoryId: categories[0].id,
      variants: [
        { size: "P", stock: 2 },
        { size: "M", stock: 4 },
      ],
    },
    {
      name: "Blusa com Manga Bordada",
      description: "Elegante e despojada",
      price: 65.0,
      categoryId: categories[1].id,
      variants: [
        { size: "P", stock: 6 },
        { size: "M", stock: 8 },
      ],
    },
    {
      name: "Sapato para Casamentos Bege",
      description: "Sapato Bege elegante",
      price: 300.0,
      categoryId: categories[4].id,
      variants: [
        { size: "36", stock: 2 },
        { size: "37", stock: 3 },
      ],
    },
    {
      name: "Tênis Nike",
      description: "Tênis esportivo confortável",
      price: 300.0,
      categoryId: categories[5].id,
      variants: [
        { size: "36", stock: 4 },
        { size: "37", stock: 2 },
        { size: "40", stock: 3 },
      ],
    },
    // Produtos de Acessórios - Relógios
    {
      name: "Relógio Feminino Dourado",
      description: "Relógio elegante com pulseira dourada",
      price: 250.0,
      categoryId: categories[7].id, // Relógios
      variants: [
        { size: "Único", stock: 10 },
      ],
    },
    {
      name: "Relógio Masculino Prata",
      description: "Relógio clássico com pulseira de aço",
      price: 380.0,
      categoryId: categories[7].id, // Relógios
      variants: [
        { size: "Único", stock: 8 },
      ],
    },
    {
      name: "Relógio Smartwatch Rosa",
      description: "Smartwatch moderno com várias funções",
      price: 450.0,
      categoryId: categories[7].id, // Relógios
      variants: [
        { size: "Único", stock: 5 },
      ],
    },
    // Produtos de Acessórios - Colares
    {
      name: "Colar de Pérolas Clássico",
      description: "Colar elegante com pérolas naturais",
      price: 180.0,
      categoryId: categories[8].id, // Colares
      variants: [
        { size: "Único", stock: 12 },
      ],
    },
    {
      name: "Colar Corrente Dourada",
      description: "Colar moderno com corrente dourada",
      price: 120.0,
      categoryId: categories[8].id, // Colares
      variants: [
        { size: "Único", stock: 15 },
      ],
    },
    {
      name: "Colar Choker Prata",
      description: "Choker delicado em prata",
      price: 95.0,
      categoryId: categories[8].id, // Colares
      variants: [
        { size: "Único", stock: 20 },
      ],
    },
  ]

  for (const productData of products) {
    const { variants, ...product } = productData
    
    // Verificar se o produto já existe
    const existingProduct = await prisma.product.findFirst({
      where: { name: product.name }
    })
    
    if (!existingProduct) {
      await prisma.product.create({
        data: {
          ...product,
          variants: {
            create: variants,
          },
        },
      })
    }
  }

  console.log("✅ Seed concluído com sucesso!")
  console.log(`👤 Admin criado: ${admin.email} / admin123`)
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
