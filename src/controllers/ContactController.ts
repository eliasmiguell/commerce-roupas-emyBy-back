import { Request, Response } from "express"
import nodemailer from "nodemailer"

interface ContactData {
  nome: string
  email: string
  telefone?: string
  mensagem: string
}

export class ContactController {
  static async sendEmail(req: Request, res: Response) {
    try {
      const { nome, email, telefone, mensagem }: ContactData = req.body

      // Validação dos campos obrigatórios
      if (!nome || !email || !mensagem) {
        return res.status(400).json({
          error: "Nome, email e mensagem são obrigatórios"
        })
      }

      // Validação do formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: "Formato de email inválido"
        })
      }

      // Configurar o transporter do nodemailer
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER || "emyby.contato@gmail.com",
          pass: process.env.EMAIL_PASS || "sua_senha_de_app"
        }
      })

      // Configurar o email
      const mailOptions = {
        from: process.env.EMAIL_USER || "emyby.contato@gmail.com",
        to: process.env.EMAIL_USER || "emyby.contato@gmail.com", // Email da loja
        subject: `Nova mensagem de contato - ${nome}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #811B2D; border-bottom: 2px solid #811B2D; padding-bottom: 10px;">
              Nova Mensagem de Contato - Emy-by
            </h2>
            
            <div style="background-color: #f89fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Informações do Cliente:</h3>
              <p><strong>Nome:</strong> ${nome}</p>
              <p><strong>Email:</strong> ${email}</p>
              ${telefone ? `<p><strong>Telefone:</strong> ${telefone}</p>` : ''}
              <div style="margin-top: 20px;">
                <h4 style="color: #333;">Mensagem:</h4>
                <div style="background-color: white; padding: 15px; border-radius: 5px; border-left: 4px solid #811B2D;">
                  ${mensagem.replace(/\n/g, '<br>')}
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid;">
              <p style="color: #666; font-size: 14px;">
                Esta mensagem foi enviada através do formulário de contato da loja Emy-by.
              </p>
              <p style="color: #666; font-size: 12px;">
                Data: ${new Date().toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        `
      }

      // Enviar o email
      await transporter.sendMail(mailOptions)

      // Enviar confirmação para o cliente
      const confirmationMailOptions = {
        from: process.env.EMAIL_USER || "emyby.contato@gmail.com",
        to: email,
        subject: "Recebemos sua mensagem - Emy-by",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #811B2D; text-align: center;">
              Obrigada pelo contato! ��
            </h2>
            
            <div style="background-color: #f89fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p>Olá <strong>${nome}</strong>,</p>
              
              <p>Recebemos sua mensagem e agradecemos pelo contato com a <strong>Emy-by</strong>!</p>
              
              <p>Nossa equipe irá analisar sua solicitação e retornaremos em breve.</p>
              
              <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Sua mensagem:</strong></p>
                <p style="font-style: italic; color: #666;">
                  "${mensagem}"
                </p>
              </div>
              
              <p>Enquanto isso, você pode nos acompanhar nas redes sociais:</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="https://m.facebook.com/profile.php?id=100004604200316" 
                   style="display: inline-block; margin: 0 10px; color: #1877f2; text-decoration: none;">
                  📘 Facebook
                </a>
                <a href="https://instagram.com/emy_by_esterfanny" 
                   style="display: inline-block; margin:0 10px; color: #e4405f; text-decoration: none;">
                  📷 Instagram
                </a>
                <a href="https://api.whatsapp.com/send/?phone=5585992245116" 
                   style="display: inline-block; margin: 0 10px; color: #25d366; text-decoration: none;">
                  💬 WhatsApp
                </a>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid;">
              <p style="color: #666; font-size: 14px;">
                <strong>Emy-by</strong><br>
                Rua José Moreira, Centro nº 26<br>
                Enfrente a praça - Ceará - CE
              </p>
            </div>
          </div>
        `
      }

      await transporter.sendMail(confirmationMailOptions)

      res.status(200).json({
        message: "Mensagem enviada com sucesso! Você receberá uma confirmação por email."
      })

    } catch (error) {
      console.error("Erro ao enviar email:", error)
      res.status(500).json({
        error: "Erro interno do servidor ao enviar mensagem"
      })
    }
  }
} 