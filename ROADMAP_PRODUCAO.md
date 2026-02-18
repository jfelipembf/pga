# 🚀 ROADMAP DE PRODUÇÃO — PGA Admin

> Documento de referência para levar o produto ao ar, comercializá-lo e operá-lo com qualidade.
> Última atualização: Fevereiro 2026

---

## 📋 ÍNDICE

1. [Visão Geral do Produto](#1-visão-geral-do-produto)
2. [Infraestrutura e Deploy (Vercel)](#2-infraestrutura-e-deploy-vercel)
3. [Integração com Stripe (Monetização)](#3-integração-com-stripe-monetização)
4. [Super Admin Panel (Painel do Dono do SaaS)](#4-super-admin-panel-painel-do-dono-do-saas)
5. [Onboarding de Novas Unidades](#5-onboarding-de-novas-unidades)
6. [Monitoramento e Observabilidade](#6-monitoramento-e-observabilidade)
7. [Segurança e Conformidade](#7-segurança-e-conformidade)
8. [Experiência do Cliente (UX/Suporte)](#8-experiência-do-cliente-uxsuporte)
9. [Checklist de Pré-Lançamento](#9-checklist-de-pré-lançamento)
10. [Arquitetura Atual do Sistema](#10-arquitetura-atual-do-sistema)

---

## 1. Visão Geral do Produto

O **PGA Admin** é um sistema SaaS multi-tenant para gestão de academias de natação. Cada cliente (unidade) acessa o sistema via URL personalizada no formato:

```
https://app.seudominio.com.br/:idTenant/:idBranch/dashboard
```

### Módulos Existentes
| Módulo | Descrição |
|--------|-----------|
| **Dashboard** | KPIs gerenciais, financeiros, operacionais e do professor |
| **Clientes / CRM** | Cadastro, perfil, matrículas, contratos e histórico financeiro |
| **Grade** | Grade semanal de turmas e controle de presença |
| **Avaliação** | Avaliações técnicas dos alunos com níveis configuráveis |
| **Treinos** | Planejamento de treinos com IA (Gemini/OpenAI) |
| **Financeiro** | Caixa, contas a receber/pagar, fluxo de caixa, DRE |
| **Vendas** | PDV para venda de contratos, produtos e serviços |
| **Gerencial** | Turmas, eventos, automações de mensagens, logs de auditoria |
| **Cadastros** | Atividades, áreas, cargos, catálogo, contratos, colaboradores |
| **Configurações** | Dados da empresa, integrações (IA, WhatsApp) |
| **Kiosk** | Autoatendimento com reconhecimento facial |

---

## 2. Infraestrutura e Deploy (Vercel)

### 2.1 Configuração do Vercel

O projeto usa **Create React App + CRACO**, então o deploy no Vercel é direto.

**`vercel.json`** (criar na raiz do projeto):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

> ⚠️ O `rewrites` é **obrigatório** para que o React Router funcione corretamente — sem ele, qualquer refresh em rota como `/abc/xyz/dashboard` retorna 404.

### 2.2 Variáveis de Ambiente no Vercel

Configurar no painel do Vercel (Settings > Environment Variables):

```env
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_DATABASE_URL=
```

### 2.3 Domínio Personalizado

1. Comprar domínio (ex: `pgaadmin.com.br`)
2. No Vercel: Settings > Domains > Add Domain
3. Configurar DNS conforme instruções do Vercel
4. SSL é automático (Let's Encrypt)

### 2.4 Estratégia de Branches

| Branch | Ambiente | URL |
|--------|----------|-----|
| `main` | Produção | `app.pgaadmin.com.br` |
| `staging` | Homologação | `staging.pgaadmin.com.br` |
| `develop` | Desenvolvimento | Preview automático do Vercel |

---

## 3. Integração com Stripe (Monetização)

### 3.1 Modelo de Negócio

Cada unidade (tenant) paga uma **assinatura mensal**. O acesso ao sistema é bloqueado automaticamente se o pagamento estiver em atraso.

### 3.2 Estrutura de Dados no Firestore

```
tenants/
  {idTenant}/
    stripeCustomerId: "cus_xxx"
    stripeSubscriptionId: "sub_xxx"
    subscriptionStatus: "active" | "past_due" | "canceled" | "trialing"
    subscriptionPlan: "basic" | "pro" | "enterprise"
    trialEndsAt: Timestamp
    currentPeriodEnd: Timestamp
```

### 3.3 Fluxo de Pagamento

```
1. Super Admin cria nova unidade no painel
2. Sistema cria Customer no Stripe via API
3. Link de pagamento é enviado ao cliente
4. Stripe Webhook atualiza subscriptionStatus no Firestore
5. App verifica subscriptionStatus no login e bloqueia se necessário
```

### 3.4 Webhook do Stripe (Cloud Function)

Criar Cloud Function `stripeWebhook` para processar eventos:

```javascript
// functions/src/stripeWebhook.js
const events = [
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
]
```

Ao receber `invoice.payment_failed` → atualizar `subscriptionStatus: "past_due"` no Firestore.

### 3.5 Bloqueio de Acesso no App

No `Authmiddleware.js`, adicionar verificação:

```javascript
// Verificar status da assinatura ao logar
if (tenant.subscriptionStatus === 'past_due' || tenant.subscriptionStatus === 'canceled') {
  return <Navigate to="/subscription-expired" />
}
```

### 3.6 Planos Sugeridos

| Plano | Preço/mês | Limite de Alunos | Funcionalidades |
|-------|-----------|------------------|-----------------|
| **Starter** | R$ 149 | até 100 | Básico (sem IA, sem Kiosk) |
| **Pro** | R$ 299 | até 500 | Completo + IA |
| **Enterprise** | R$ 599 | ilimitado | Completo + IA + Kiosk + Suporte prioritário |

---

## 4. Super Admin Panel (Painel do Dono do SaaS)

Este é o painel **separado** que você usa para gerenciar todos os clientes (tenants). Não é o mesmo app que os clientes usam.

### 4.1 O que o Super Admin precisa ter

#### 📊 Dashboard do SaaS
- Total de tenants ativos / inativos / em trial
- MRR (Monthly Recurring Revenue)
- Churn do mês
- Novos clientes no mês
- Alertas de pagamentos vencidos

#### 🏢 Gestão de Tenants
- **Listar** todos os tenants com status, plano e data de vencimento
- **Criar** nova unidade (gera idTenant, idBranch, usuário admin, Customer no Stripe)
- **Editar** dados da unidade (nome, plano, limites)
- **Suspender / Reativar** acesso
- **Impersonar** (acessar o sistema como se fosse o cliente, para suporte)
- **Deletar** (com soft-delete e período de retenção de dados)

#### 💳 Gestão Financeira
- Ver histórico de pagamentos por tenant
- Aplicar desconto / cupom
- Cancelar assinatura
- Gerar link de pagamento manual

#### 👥 Usuários do Tenant
- Ver todos os usuários de uma unidade
- Resetar senha
- Desativar usuário específico

#### 📈 Analytics
- Uso por módulo (quais features são mais usadas)
- Tenants mais ativos
- Tenants em risco de churn (sem login há X dias)

#### 🔔 Comunicação
- Enviar notificação/aviso para todos os tenants
- Enviar e-mail para tenant específico
- Histórico de comunicações

### 4.2 Implementação

O Super Admin pode ser:
- **Opção A**: Uma rota separada no mesmo app (`/superadmin/*`) protegida por claim `isSuperAdmin: true` no Firebase Auth
- **Opção B**: Um projeto React separado (mais seguro, recomendado)

**Firestore Security Rules** para proteger:
```javascript
match /tenants/{tenantId} {
  allow read, write: if request.auth.token.isSuperAdmin == true;
}
```

---

## 5. Onboarding de Novas Unidades

### 5.1 Fluxo Automatizado de Criação

Ao criar um novo tenant no Super Admin:

```
1. Gerar idTenant único (ex: "academia-aqua-sp")
2. Gerar idBranch padrão (ex: "matriz")
3. Criar documento em /tenants/{idTenant}
4. Criar documento em /tenants/{idTenant}/branches/{idBranch}
5. Criar usuário admin no Firebase Auth
6. Criar Customer no Stripe
7. Criar assinatura com período de trial (ex: 14 dias)
8. Enviar e-mail de boas-vindas com:
   - URL de acesso: app.pgaadmin.com.br/{idTenant}/{idBranch}/login
   - Login e senha temporária
   - Link para tutorial/onboarding
9. Criar cargos padrão (Proprietário, Gestor, Professor, etc.)
10. Criar configurações padrão da empresa
```

### 5.2 Checklist de Onboarding para o Cliente

Criar uma tela de "Primeiros Passos" que aparece para novos tenants:

- [ ] Adicionar logo e dados da empresa
- [ ] Cadastrar atividades (ex: Natação, Hidroginástica)
- [ ] Cadastrar áreas/piscinas
- [ ] Criar contratos/planos
- [ ] Cadastrar colaboradores
- [ ] Criar turmas
- [ ] Cadastrar primeiros alunos

---

## 6. Monitoramento e Observabilidade

### 6.1 Firebase Crashlytics / Performance

Já integrado via Firebase. Ativar no console do Firebase:
- **Crashlytics**: captura erros em produção
- **Performance Monitoring**: mede tempo de carregamento

### 6.2 Sentry (Recomendado)

Instalar para captura detalhada de erros com stack trace:

```bash
npm install @sentry/react
```

```javascript
// src/index.js
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://xxx@sentry.io/xxx",
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### 6.3 Logs de Auditoria (Já Implementado ✅)

O sistema já possui `AuditService` que registra ações em `/tenants/{id}/auditLogs`. A página de Audit Logs já existe em `/admin/audit-logs`.

### 6.4 Alertas Operacionais

Configurar alertas no Firebase Console ou via Cloud Functions:
- Erro em Cloud Function → notificar via e-mail/Slack
- Uso de Firestore acima do limite → alerta
- Falha no webhook do Stripe → alerta crítico

### 6.5 Métricas de Uso (Analytics)

Implementar tracking de eventos com Firebase Analytics:

```javascript
import { logEvent } from "firebase/analytics";

// Exemplos de eventos a trackear
logEvent(analytics, 'feature_used', { feature: 'training_ai', tenant: idTenant });
logEvent(analytics, 'sale_completed', { amount: total, tenant: idTenant });
```

---

## 7. Segurança e Conformidade

### 7.1 Firestore Security Rules

Revisar e fortalecer as regras atuais:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Tenant data: só acessível por usuários do mesmo tenant
    match /tenants/{tenantId}/{document=**} {
      allow read, write: if request.auth != null 
        && request.auth.token.idTenant == tenantId
        && request.auth.token.idBranch != null;
    }
    
    // Super admin: acesso total
    match /{document=**} {
      allow read, write: if request.auth.token.isSuperAdmin == true;
    }
  }
}
```

### 7.2 Firebase Auth Custom Claims

Ao fazer login, o backend deve setar claims no token:
```javascript
// Cloud Function: setCustomClaims
await admin.auth().setCustomUserClaims(uid, {
  idTenant: "academia-aqua-sp",
  idBranch: "matriz",
  role: "proprietario",
  isSuperAdmin: false,
});
```

### 7.3 LGPD (Lei Geral de Proteção de Dados)

- **Política de Privacidade**: criar página pública com política clara
- **Termos de Uso**: criar e exibir no cadastro
- **Direito ao esquecimento**: implementar exclusão de dados do cliente
- **Exportação de dados**: permitir que o tenant exporte seus dados
- **Retenção de dados**: definir política (ex: dados deletados ficam 90 dias)

### 7.4 Backups

Firebase faz backup automático, mas configurar:
- Export diário do Firestore para Cloud Storage
- Retenção de 30 dias de backups

---

## 8. Experiência do Cliente (UX/Suporte)

### 8.1 Central de Ajuda

Criar documentação em ferramenta como **Notion**, **GitBook** ou **Intercom**:
- Tutoriais em vídeo por módulo
- FAQ
- Changelog de versões

### 8.2 Chat de Suporte

Integrar **Intercom**, **Crisp** ou **Tawk.to** para suporte em tempo real:

```javascript
// Identificar o usuário no chat
window.Intercom('boot', {
  app_id: 'xxx',
  name: user.displayName,
  email: user.email,
  company: { id: idTenant, name: tenant.name },
});
```

### 8.3 Tour de Onboarding

Usar **Shepherd.js** ou **Intro.js** para guiar novos usuários:
- Tour automático no primeiro acesso
- Tooltips contextuais nas funcionalidades principais

### 8.4 Feedback In-App

Botão de feedback em todas as páginas para coletar sugestões e reportar bugs diretamente do app.

### 8.5 Status Page

Criar página pública de status (ex: `status.pgaadmin.com.br`) usando **Upptime** ou **Betteruptime** para comunicar incidentes.

---

## 9. Checklist de Pré-Lançamento

### ✅ Técnico
- [ ] Configurar `vercel.json` com rewrites
- [ ] Configurar variáveis de ambiente no Vercel
- [ ] Domínio personalizado configurado com SSL
- [ ] Firebase Security Rules revisadas e testadas
- [ ] Firebase Custom Claims implementados
- [ ] Webhook do Stripe funcionando
- [ ] Cloud Functions deployadas e testadas
- [ ] Sentry ou Firebase Crashlytics ativo
- [ ] Build de produção sem erros (`npm run build`)
- [ ] Testar em mobile (responsividade)
- [ ] Testar em Safari (compatibilidade)

### ✅ Produto
- [ ] Fluxo de criação de tenant testado end-to-end
- [ ] Fluxo de pagamento testado (trial → ativo → vencido → bloqueado)
- [ ] E-mail de boas-vindas configurado
- [ ] Política de Privacidade e Termos de Uso criados
- [ ] Página de erro de assinatura vencida criada
- [ ] Checklist de onboarding implementado

### ✅ Negócio
- [ ] Conta Stripe em modo produção (não test mode)
- [ ] Planos e preços definidos no Stripe
- [ ] Conta de e-mail de suporte criada
- [ ] Central de ajuda com tutoriais básicos
- [ ] Contrato de prestação de serviços preparado

### ✅ Super Admin
- [ ] Painel de gestão de tenants criado
- [ ] Fluxo de criação de nova unidade automatizado
- [ ] Dashboard com MRR e métricas básicas

---

## 10. Arquitetura Atual do Sistema

### Stack
| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 18 + Redux + React Router v6 |
| **Build** | Create React App + CRACO |
| **UI** | Reactstrap (Bootstrap 5) + SCSS |
| **Backend** | Firebase (Firestore + Auth + Storage + Functions) |
| **Deploy** | Vercel (frontend) + Firebase (backend) |
| **IA** | Google Gemini / OpenAI (configurável por tenant) |
| **Pagamentos** | Stripe (a integrar) |
| **Mensagens** | WhatsApp via EVO API |

### Estrutura Multi-Tenant
```
URL: /:idTenant/:idBranch/dashboard
Firestore: /tenants/{idTenant}/branches/{idBranch}/...
Auth: Custom Claims com idTenant + idBranch + role
```

### Módulos e Rotas
```
/dashboard              → Dashboard principal
/clients                → Lista de clientes
/clients/:id            → Perfil do cliente
/crm                    → CRM (leads e funil)
/grade                  → Grade semanal
/grade/enroll           → Matrícula em turma
/evaluation             → Avaliações técnicas
/training               → Planejamento de treinos
/financial/cashier      → Caixa
/financial/receivables  → Contas a receber
/financial/payables     → Contas a pagar
/financial/cash-flow    → Fluxo de caixa
/financial/dre          → DRE
/financial/contracts    → Contratos/Planos
/financial/bank-accounts → Contas bancárias
/financial/acquirers    → Adquirentes (Stone, etc)
/sales/new              → PDV / Nova venda
/admin/staff            → Colaboradores
/admin/staff/:id        → Perfil do colaborador
/admin/classes          → Turmas
/admin/events           → Eventos
/admin/activities       → Atividades/Modalidades
/admin/areas            → Áreas/Piscinas
/admin/roles            → Cargos e permissões
/admin/catalog          → Catálogo de produtos
/admin/evaluation-levels → Níveis de avaliação
/admin/audit-logs       → Logs de auditoria
/automation             → Automações de mensagens
/settings/company       → Dados da empresa
/settings/integrations  → Integrações (IA, WhatsApp)
/kiosk                  → Modo quiosque (autoatendimento)
```

### Serviços Implementados
```
Core/           AuditService, StorageService
Admin/          ActivityService, AreaService, CatalogService,
                EvaluationLevelService, RoleService, StaffService
Classes/        ClassService, SessionService, AttendanceService
Clients/        ClientService, EnrollmentService, ClientContractService
Financial/      CashierService, ReceivableService, PayableService,
                BankAccountService, AcquirerService, LedgerService
Sales/          SalesService, SalesPaymentProcessor
Automation/     AIService, IntegrationRepository
FaceRecognition/ FaceRecognitionService
```

---

## 📌 Prioridades Recomendadas

### 🔴 Crítico (antes de lançar)
1. `vercel.json` com rewrites configurado
2. Firestore Security Rules revisadas
3. Integração Stripe + webhook
4. Bloqueio de acesso por status de assinatura
5. Super Admin básico (criar/listar tenants)

### 🟡 Importante (primeiros 30 dias)
6. Onboarding automatizado de novos tenants
7. Sentry para monitoramento de erros
8. Central de ajuda com tutoriais
9. Chat de suporte integrado
10. E-mails transacionais (boas-vindas, vencimento)

### 🟢 Evolução (60-90 dias)
11. Analytics de uso por módulo
12. Dashboard do SaaS com MRR
13. Tour de onboarding in-app
14. Status page pública
15. Exportação de dados (LGPD)

---

*Documento gerado em 18/02/2026. Atualizar conforme o produto evolui.*
