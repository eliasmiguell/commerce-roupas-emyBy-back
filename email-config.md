# Configuração de Email - Emy-by

## Para configurar o envio de emails, siga estes passos:

### 1Criar arquivo .env no diretório emy-backend/

```env
# Configurações do Banco de Dados
DATABASE_URL=postgresql://postgres:123456ocalhost:5432emyby

# Configurações de Email (Gmail)
# Para usar Gmail, você precisa:
# 1. Ativar autenticação de 2 fatores na sua conta Google
# 2Gerar uma senha de app em: https://myaccount.google.com/apppasswords
EMAIL_USER=emyby.contato@gmail.com
EMAIL_PASS=sua_senha_de_app_aqui

# Configurações do Servidor
PORT=81JWT_SECRET=seu_jwt_secret_aqui

# Configurações de CORS
CORS_ORIGIN=http://localhost:3000
```

### 2. Configurar Gmail

1. Acesse sua conta Google2. Vá em "Gerenciar sua Conta Google"3ive a autenticação de 2fatores
4. Vá em Segurança> Senhas de app"5 Gere uma senha de app para "Email"6 Use essa senha no campo EMAIL_PASS

###3. Testar o envio

Após configurar, reinicie o servidor e teste o formulário de contato.

## Funcionalidades implementadas:

- ✅ Envio de email para a loja com dados do cliente
- ✅ Email de confirmação para o cliente
- ✅ Validação de campos obrigatórios
- ✅ Validação de formato de email
- ✅ Templates HTML personalizados
- ✅ Tratamento de erros 