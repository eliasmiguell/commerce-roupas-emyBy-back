import type { Request, Response, NextFunction } from "express"
import { verifyToken, type JWTPayload } from "../lib/auth"

export interface AuthRequest extends Request {
  user?: JWTPayload
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      return res.status(401).json({ error: "Token não fornecido" })
    }

    const token = authHeader.replace("Bearer ", "")
    const decoded = verifyToken(token)

    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ error: "Token inválido" })
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Acesso negado. Apenas administradores." })
  }
  next()
}
