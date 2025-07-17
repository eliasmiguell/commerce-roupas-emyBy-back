import { Request, Response, NextFunction } from "express"
import sharp from "sharp"
import path from "path"
import fs from "fs"

export const imageOptimizer = async (req: Request, res: Response, next: NextFunction) => {
  const imagePath = req.path
  
  // Verificar se é uma requisição de imagem
  if (!imagePath.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
    return next()
  }

  // Extrair parâmetros de query
  const { w, h, q } = req.query
  const width = w ? parseInt(w as string) : undefined
  const height = h ? parseInt(h as string) : undefined
  const quality = q ? parseInt(q as string) : 80

  // Se não há parâmetros de otimização, continuar normalmente
  if (!width && !height && quality === 80) {
    return next()
  }

  const fullPath = path.join(__dirname, "../../public", imagePath)
  
  // Verificar se o arquivo existe
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: "Imagem não encontrada" })
  }

  try {
    // Ler o arquivo
    const imageBuffer = fs.readFileSync(fullPath)
    
    // Processar com Sharp
    let sharpInstance = sharp(imageBuffer)
    
    // Redimensionar se especificado
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'cover',
        withoutEnlargement: true
      })
    }
    
    // Definir formato e qualidade
    const ext = path.extname(imagePath).toLowerCase()
    let processedImage: Buffer
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        processedImage = await sharpInstance
          .jpeg({ quality })
          .toBuffer()
        res.setHeader('Content-Type', 'image/jpeg')
        break
      case '.png':
        processedImage = await sharpInstance
          .png({ quality })
          .toBuffer()
        res.setHeader('Content-Type', 'image/png')
        break
      case '.webp':
        processedImage = await sharpInstance
          .webp({ quality })
          .toBuffer()
        res.setHeader('Content-Type', 'image/webp')
        break
      case '.gif':
        processedImage = await sharpInstance
          .gif()
          .toBuffer()
        res.setHeader('Content-Type', 'image/gif')
        break
      default:
        processedImage = await sharpInstance
          .jpeg({ quality })
          .toBuffer()
        res.setHeader('Content-Type', 'image/jpeg')
    }
    
    // Configurar headers de cache
    res.setHeader('Cache-Control', 'public, max-age=31536000')
    res.setHeader('Content-Length', processedImage.length.toString())
    
    // Enviar imagem processada
    res.send(processedImage)
    
  } catch (error) {
    console.error('Erro ao processar imagem:', error)
    return next()
  }
} 