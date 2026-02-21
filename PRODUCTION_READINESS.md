# 🏭 Análise de Prontidão para Produção — PGA Sistema

**Data da Análise:** 2026-02-21  
**Projeto:** PGA Sistema (pgasistema)  
**Stack:** React 18 + Firebase (Firestore, Auth, Hosting, Functions, Storage)  
**Codebase:** ~586 arquivos JS, 22MB de build  

---

## 📊 Resumo Executivo

| Categoria | Status | Nota |
|-----------|--------|------|
| Arquitetura & Código | 🟢 Bom | 8/10 |
| Segurança | 🟡 Atenção | 5/10 |
| Testes | 🔴 Crítico | 1/10 |
| Observabilidade & Monitoramento | 🔴 Crítico | 2/10 |
| Performance & Otimização | 🟡 Atenção | 6/10 |
| DevOps & CI/CD | 🔴 Crítico | 2/10 |
| Resiliência & Backup | 🟡 Atenção | 4/10 |
| Documentação | 🟡 Atenção | 5/10 |
| **NOTA GLOBAL** | **🟡 NÃO PRONTO** | **4.1/10** |

> **Veredicto: O sistema NÃO está pronto para produção comercial.** A aplicação funciona e possui boa arquitetura, mas faltam elementos essenciais de segurança, testes, monitoramento e DevOps que são obrigatórios para operação em produção com clientes reais pagantes.

---

## ✅ O que está BEM (Pontos Fortes)

### 1. Arquitetura de Código
- ✅ **Separação clara de camadas**: `services/` → `data/repositories/` → `data/schemas/` → `hooks/` → `pages/`
- ✅ **Padrão Repository** com `BaseRepository` reutilizável
- ✅ **Multi-tenant** nativo via `/:idTenant/:idBranch` nas rotas
- ✅ **Audit Loggers** e **Domain Rules** separados (refatoração recente)
- ✅ **Sistema de permissões** robusto com `useAuth`, `Authmiddleware`, roles e permissions
- ✅ **Validação com Yup** nos schemas
- ✅ **Error Boundary** global implementado
- ✅ **Lazy loading** com `React.lazy` e `Suspense`
- ✅ **Firestore Security Rules** configuradas com verificação de autenticação e pertencimento à filial

### 2. Funcionalidades de Negócio
- ✅ Sistema financeiro completo (Caixa, Contas a Pagar/Receber, DRE, Ledger com partidas dobradas)
- ✅ Sistema de CRM e gestão de leads
- ✅ Gestão de contratos com ciclo de vida completo (ativação, suspensão, cancelamento, renovação)
- ✅ Grade horária com gestão de sessões
- ✅ 15 Cloud Functions para automações (fechamento automático de caixa, lembretes, etc.)
- ✅ Integração com WhatsApp (Evolution API) e IA (OpenAI/Gemini)

### 3. Firebase
- ✅ Firebase SDK v11 (modular/tree-shakeable)
- ✅ Cloud Functions v2 com `maxInstances: 10` (controle de custo)
- ✅ Emuladores configurados para desenvolvimento local
- ✅ Índices compostos definidos em `firestore.indexes.json`

---

## 🔴 CRÍTICO — Bloqueia o Lançamento

### C1. Zero Testes Automatizados
**Risco: ALTÍSSIMO**

```
Arquivos de teste encontrados: 1 (App.test.js — vazio/padrão CRA)
Cobertura de testes: 0%
```

**Impacto:** Qualquer deploy pode introduzir bugs silenciosos em fluxos financeiros (Caixa, Ledger, Sales), sem nenhuma rede de segurança.

**Ação Requerida:**
- [ ] Testes unitários para **todas as Domain Rules** (`CashierRules`, `PayableRules`, `ReceivableRules`, etc.)
- [ ] Testes de integração para **fluxos financeiros críticos** (criação de venda → geração de recebíveis → liquidação → atualização do Ledger)
- [ ] Testes E2E mínimos (login → dashboard → criar venda → fechar caixa)
- [ ] Configurar CI para rodar testes antes de cada deploy

---

### C2. Credenciais Hardcoded e Expostas no `.env`
**Risco: ALTO**

O arquivo `.env` contém todas as chaves Firebase em texto plano **e está no `.gitignore`**, mas:

```plaintext
# PROBLEMAS:
1. O .env contém a API Key Firebase diretamente
2. O AIService.js aceita API Keys via process.env no FRONTEND
3. O MessagingService.js tem API Key da Evolution API no FRONTEND
4. firebase-admin está listado como dependência no package.json DO FRONTEND
5. jsonwebtoken está no package.json DO FRONTEND (lib server-side)
```

**Impacto:** 
- API Keys de IA (OpenAI/Gemini) expostas no bundle do browser — qualquer pessoa pode inspecionar e usar
- A chave da Evolution API está no frontend — permite envio de mensagens WhatsApp não autorizado

**Ação Requerida:**
- [ ] **Remover `firebase-admin` e `jsonwebtoken`** do `package.json` do frontend (são dependências de servidor)
- [ ] Mover chamadas de IA para **Cloud Functions** (proxy) para não expor API Keys
- [ ] Mover chamadas da Evolution API para **Cloud Functions** (proxy)
- [ ] Criar `.env.example` sem valores reais
- [ ] Configurar separação de ambientes: `.env.development`, `.env.production`

---

### C3. Sem Monitoramento de Erros em Produção
**Risco: ALTO**

```
Serviços de monitoramento configurados: NENHUM
O GlobalErrorBoundary apenas faz console.error("Uncaught error:")
Há um comentário: "// Você também pode registrar o erro em um serviço de relatório (Sentry/LogRocket)"
```

**Impacto:** Erros em produção passarão despercebidos. O cliente pode enfrentar problemas por dias sem que você saiba.

**Ação Requerida:**
- [ ] Integrar **Sentry** (free tier: 5K eventos/mês) para frontend
- [ ] Configurar alertas no **Google Cloud Monitoring** para Cloud Functions
- [ ] Adicionar `Sentry.captureException()` no `GlobalErrorBoundary.componentDidCatch`
- [ ] Dashboard de saúde com uptime e métricas básicas

---

### C4. Sem Pipeline de CI/CD
**Risco: ALTO**

```
Deploy atual: Manual via `firebase deploy`
Build check automático: Nenhum
Lint automático: Nenhum
Testes automáticos: Nenhum
Ambientes (staging/prod): Nenhum
```

**Impacto:** Deploy manual é propenso a erros. Sem staging, todo bug vai direto para produção.

**Ação Requerida:**
- [ ] Configurar **GitHub Actions** com pipeline:
  1. `npm run lint` → `npm test` → `npm run build` → `firebase deploy --only hosting`
- [ ] Criar **2 projetos Firebase**: `pgasistema-staging` e `pgasistema` (produção)
- [ ] Configurar deploy automático: push em `develop` → staging, push em `main` → produção  
- [ ] Adicionar branch protection rules no GitHub

---

## 🟡 IMPORTANTE — Corrigir Antes do Lançamento Comercial

### I1. Firestore Security Rules Insuficientes
**Risco: MÉDIO-ALTO**

```javascript
// Regra genérica atual — MUITO permissiva:
match /{collectionName}/{docId} {
    allow read, write: if isSignedIn() && isStaffOf(tenantId, branchId);
}
```

**Problema:** Qualquer colaborador autenticado pode **ler e escrever** em QUALQUER coleção da filial, incluindo:
- `audit_logs` (poderia apagar trilhas de auditoria)
- `ledgerEntries` (poderia manipular o Ledger contábil)
- `staff` (regra específica existe, mas é sobreposta pela genérica)
- Dados financeiros de outros usuários

**Ação Requerida:**
- [ ] Regras específicas para coleções sensíveis:
  ```javascript
  // Audit logs: somente leitura para staff, escrita somente pelo sistema
  match /audit_logs/{logId} {
      allow read: if isSignedIn() && isStaffOf(tenantId, branchId);
      allow write: if false; // Apenas Cloud Functions/Admin SDK
  }
  
  // Ledger: apenas leitura
  match /ledgerEntries/{entryId} {
      allow read: if isSignedIn() && isStaffOf(tenantId, branchId);
      allow write: if false; // Apenas Cloud Functions/Admin SDK
  }
  ```
- [ ] Implementar validação por **role** nas regras (owner vs. professor vs. recepcionista)
- [ ] Adicionar regras de validação de dados (campos obrigatórios, tipos, etc.)

---

### I2. Sem Storage Security Rules
**Risco: MÉDIO**

```
Arquivo storage.rules: NÃO ENCONTRADO
```

O sistema usa Firebase Storage (fotos de clientes, anexos), mas não há regras de segurança configuradas.

**Ação Requerida:**
- [ ] Criar `storage.rules`:
  ```
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      match /tenants/{tenantId}/branches/{branchId}/{allPaths=**} {
        allow read, write: if request.auth != null
          && firestore.exists(/databases/(default)/documents/tenants/$(tenantId)/branches/$(branchId)/staff/$(request.auth.uid));
      }
      match /{allPaths=**} {
        allow read, write: if false;
      }
    }
  }
  ```
- [ ] Adicionar `"storage": { "rules": "storage.rules" }` no `firebase.json`

---

### I3. Logs de Console Excessivos em Produção

```
Arquivos com console.log/error/warn nos services: 30
```

**Ação Requerida:**
- [ ] Criar `logger.js` com níveis (dev vs. prod):
  ```javascript
  const isDev = process.env.NODE_ENV === 'development'
  export const logger = {
      info: (...args) => isDev && console.log(...args),
      warn: (...args) => console.warn(...args),
      error: (...args) => { console.error(...args); Sentry?.captureException(args[0]) }
  }
  ```
- [ ] Substituir `console.error` por `logger.error` nos services

---

### I4. Performance do Bundle

```
Tamanho do build: 22MB (inclui source maps e assets)
```

**Ação Requerida:**
- [ ] Verificar se `GENERATE_SOURCEMAP=false` está ativo no build de produção ✅ (já está)
- [ ] Analisar bundle com `npx source-map-explorer build/static/js/*.js`
- [ ] Avaliar remoção de bibliotecas pesadas não usadas:
  - `react-beautiful-dnd` (duplicada com `@hello-pangea/dnd`)
  - `draft-js` + `react-draft-wysiwyg` (se não usado)
  - `echarts` vs `apexcharts` (escolher um, não dois)
  - `react-jvectormap` (se não usado)
  - `mdbreact` (se não usado — framework CSS alternativo)
  - `firebase-admin` (NÃO deveria estar no frontend)
  - `jsonwebtoken` (NÃO deveria estar no frontend)
- [ ] Implementar **code splitting** por módulo (Financial, Admin, etc.)

---

### I5. Backup & Disaster Recovery

**Ação Requerida:**
- [ ] Ativar **Firestore Backups automáticos** (Point-in-time Recovery ou exports programados)
- [ ] Documentar **procedimento de recovery**
- [ ] Script de backup manual para emergências
- [ ] Testar restauração de backup pelo menos uma vez

---

### I6. Rate Limiting & Abuse Prevention

```
Rate limiting configurado: NENHUM
```

**Ação Requerida:**
- [ ] Configurar rate limiting nas Cloud Functions (Firebase App Check ou manual)
- [ ] Implementar limites no frontend (debounce em buscas, throttle em submissões)
- [ ] Configurar **Firebase App Check** para proteger APIs

---

### I7. Sem `.env.production` e `.env` no Git

O `.env` está no `.gitignore` ✅, mas:
- Não existe `.env.example` para documentar variáveis necessárias
- Sem separação de ambientes (dev/staging/prod)

**Ação Requerida:**
- [ ] Criar `.env.example`:
  ```
  REACT_APP_APIKEY=
  REACT_APP_AUTHDOMAIN=
  REACT_APP_PROJECTID=
  REACT_APP_STORAGEBUCKET=
  REACT_APP_MESSAGINGSENDERID=
  REACT_APP_APPID=
  REACT_APP_MEASUREMENTID=
  REACT_APP_APP_URL=
  ```
- [ ] Nunca armazenar chaves de IA ou Evolution API no frontend

---

## 🟢 NICE TO HAVE — Melhorias Pós-Lançamento

### N1. Migrar de Redux para React Context ou Zustand
O Redux é usado apenas para autenticação. É overengineering para o uso atual. Considerar simplificar pós-lançamento.

### N2. Internacionalização (i18n)
O i18next está configurado mas as strings estão em português hardcoded. Se a expansão internacional não é prioridade, remover a dependência para reduzir complexidade.

### N3. Refatorar Scripts de Migração
A pasta `functions/scripts/` contém 29 scripts de migração one-off. Mover para uma pasta separada `scripts/migrations/` e documentar quais já foram executados.

### N4. Implementar Paginação Real
Muitas listagens usam `limit` fixo (50-200) e filtram em memória (`rawData.filter()`). Para escala, implementar paginação com cursor no Firestore.

### N5. Remover Dependências Duplicadas
```
react-beautiful-dnd  (13.1.1) — ARQUIVADO, não mantido
@hello-pangea/dnd    (17.0.0) — Fork mantido do mesmo lib
→ Remover react-beautiful-dnd
```

### N6. Service Worker
O `serviceWorker.js` existe mas está desregistrado. Avaliar se PWA offline é desejável para o kiosk.

---

## 📋 Checklist Pré-Produção (Ordem de Prioridade)

### 🔴 Semana 1-2: Segurança (Bloqueantes)
- [ ] Remover `firebase-admin` e `jsonwebtoken` do frontend `package.json`
- [ ] Mover chamadas de IA e WhatsApp para Cloud Functions (proxy)
- [ ] Criar `storage.rules` e deploy
- [ ] Reforçar `firestore.rules` (proteger `audit_logs`, `ledgerEntries`)
- [ ] Criar `.env.example`
- [ ] Configurar Firebase App Check

### 🔴 Semana 2-3: Monitoramento & Observabilidade
- [ ] Instalar e configurar Sentry (frontend + Cloud Functions)
- [ ] Configurar Cloud Monitoring alertas (erros 5xx, latência)
- [ ] Criar dashboard de saúde básico
- [ ] Integrar Sentry no `GlobalErrorBoundary`

### 🔴 Semana 3-4: CI/CD & Ambientes
- [ ] Criar projeto Firebase de staging
- [ ] Pipeline GitHub Actions (lint → test → build → deploy)
- [ ] Branch protection em `main`
- [ ] Separação de `.env` por ambiente

### 🟡 Semana 4-5: Testes Mínimos
- [ ] Testes unitários para Domain Rules (CashierRules, ReceivableRules, PayableRules)
- [ ] Testes para FinancialCalculator e LedgerService
- [ ] Testes E2E críticos (login, criar venda, fechar caixa)
- [ ] Meta: >60% cobertura nos services

### 🟡 Semana 5-6: Performance & Polimento
- [ ] Análise e otimização do bundle
- [ ] Remover dependências não usadas
- [ ] Substituir `console.error` por logger centralizado
- [ ] Ativar Firestore backups automáticos

---

## 🎯 META: Produção-Ready = Nota ≥ 7.5/10

| Categoria | Atual | Meta |
|-----------|-------|------|
| Arquitetura | 8/10 | 8/10 ✅ |
| Segurança | 5/10 | 8/10 |
| Testes | 1/10 | 7/10 |
| Monitoramento | 2/10 | 7/10 |
| Performance | 6/10 | 7/10 |
| DevOps/CI/CD | 2/10 | 8/10 |
| Resiliência | 4/10 | 7/10 |
| Documentação | 5/10 | 7/10 |
| **MÉDIA** | **4.1** | **7.4** |

---

> **Estimativa de Esforço Total: 4-6 semanas** para atingir nível de produção confiável.
> 
> As semanas 1-3 (Segurança + Monitoramento + CI/CD) são as mais críticas e devem ser feitas ANTES de aceitar clientes pagantes.
