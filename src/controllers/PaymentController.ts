import { Request, Response } from "express";
import { PrismaClient, PaymentStatus } from "@prisma/client";

const prisma = new PrismaClient();

export class PaymentController {
  // Criar pagamento
  async createPayment(req: Request, res: Response) {
    try {
      const { orderId, method, amount } = req.body;

      if (!orderId || !method || !amount) {
        return res.status(400).json({ error: "Dados do pagamento são obrigatórios" });
      }

      // Verificar se o pedido existe
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { payment: true },
      });

      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      if (order.payment) {
        return res.status(400).json({ error: "Pedido já possui pagamento" });
      }

      // Criar o pagamento
      const payment = await prisma.payment.create({
        data: {
          orderId,
          method,
          amount: parseFloat(amount),
          status: "PENDING",
        },
      });

      res.status(201).json({ payment });
    } catch (error) {
      console.error("Erro ao criar pagamento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Processar pagamento (simulação)
  async processPayment(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      });

      if (!payment) {
        return res.status(404).json({ error: "Pagamento não encontrado" });
      }

      if (payment.status !== "PENDING") {
        return res.status(400).json({ error: "Pagamento já foi processado" });
      }

      // Simular processamento do pagamento
      // Em um ambiente real, aqui seria feita a integração com gateway de pagamento
      const isApproved = Math.random() > 0.1; // 90% de chance de aprovação

      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: isApproved ? "APPROVED" : "REJECTED",
          transactionId: isApproved ? `TXN_${Date.now()}` : null,
        },
      });

      // Se aprovado, atualizar status do pedido
      if (isApproved) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: "CONFIRMED" },
        });
      }

      res.json({
        payment: updatedPayment,
        message: isApproved ? "Pagamento aprovado" : "Pagamento rejeitado",
      });
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Obter pagamento por ID
  async getPaymentById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: { order: true },
      });

      if (!payment) {
        return res.status(404).json({ error: "Pagamento não encontrado" });
      }

      res.json({ payment });
    } catch (error) {
      console.error("Erro ao buscar pagamento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Obter pagamento por pedido
  async getPaymentByOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      const payment = await prisma.payment.findUnique({
        where: { orderId },
        include: { order: true },
      });

      if (!payment) {
        return res.status(404).json({ error: "Pagamento não encontrado" });
      }

      res.json({ payment });
    } catch (error) {
      console.error("Erro ao buscar pagamento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Listar todos os pagamentos (admin)
  async getAllPayments(req: Request, res: Response) {
    try {
      const payments = await prisma.payment.findMany({
        include: { order: true },
        orderBy: { createdAt: "desc" },
      });

      res.json({ payments });
    } catch (error) {
      console.error("Erro ao listar pagamentos:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }

  // Cancelar pagamento
  async cancelPayment(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: { order: true },
      });

      if (!payment) {
        return res.status(404).json({ error: "Pagamento não encontrado" });
      }

      if (payment.status !== "PENDING") {
        return res.status(400).json({ error: "Pagamento não pode ser cancelado" });
      }

      const updatedPayment = await prisma.payment.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      res.json({ payment: updatedPayment });
    } catch (error) {
      console.error("Erro ao cancelar pagamento:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
} 