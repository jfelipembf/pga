# 🚀 Checklist Pré-Produção - Sistema PGA

## ✅ Status Atual: PRONTO PARA DEPLOY

---

## 📋 1. Verificações de Código

### ✅ Build de Produção
- [x] Build executado sem erros (`npm run build`)
- [x] Warnings identificados (não-críticos)
- [x] Bundle de produção otimizado

### ✅ Consistência de Datas
- [x] Todos os serviços usando `normalizeDate(new Date())`
- [x] Imports de `normalizeDate` adicionados onde necessário
- [x] Eliminadas chamadas diretas a `new Date()` em saves do Firestore

### ✅ Refatorações Aplicadas
- [x] Módulo TrainingPlanning implementado
- [x] Locale pt-BR registrado em calendários
- [x] Header otimizado (alinhamento de ícones)
- [x] Duplicações de código removidas
- [x] Funções utilitárias consolidadas

### ✅ Contexto Multi-Tenant
- [x] Hook `useTenant` com verificação `isReady`
- [x] Todos os hooks críticos verificando `isReady` antes de fetch
- [x] Prevenção de chamadas prematuras sem contexto

---

## 🔍 2. Testes Recomendados

### 🎯 Funcionalidades Críticas
- [ ] **Autenticação**
  - Login/Logout
  - Recuperação de senha
  - Permissões por role

- [ ] **Vendas & Financeiro**
  - Criação de vendas
  - Geração de parcelas
  - Pagamentos (PIX, Cartão, Dinheiro)
  - Contas a receber/pagar
  - Fluxo de caixa
  - DRE (Demonstrativo de Resultados)

- [ ] **Matrículas & Turmas**
  - Matricular aluno em turma
  - Agendar aula experimental
  - Cancelamento de matrícula
  - Presença/Chamada

- [ ] **Treinos (Novo Módulo)**
  - Criar planejamento de treino
  - Editar treino existente
  - Visualização em Modo TV
  - Calendário de treinos

- [ ] **Clientes**
  - Cadastro de cliente
  - Edição de dados
  - Visualização de perfil
  - Histórico financeiro

### 🌐 Navegação Multi-Tenant
- [ ] Acessar via URL: `/{tenantSlug}/{branchSlug}/dashboard`
- [ ] Verificar se dados carregam corretamente
- [ ] Trocar entre unidades/filiais
- [ ] Verificar persistência no localStorage

### 📱 Responsividade
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## 🔐 3. Segurança

### Variáveis de Ambiente
- [ ] `.env` configurado com values corretos
- [ ] Firebase config validado
- [ ] URLs de produção configuradas

### Firebase Security Rules
- [ ] Firestore Rules revisadas
- [ ] Storage Rules revisadas
- [ ] RTDB Rules revisadas (se aplicável)

### Auditoria
- [ ] Logs de auditoria funcionando
- [ ] Rastreamento de ações críticas
- [ ] Identificação de usuário em logs

---

## 🗄️ 4. Banco de Dados

### Índices Firestore
Verificar se os seguintes índices compostos existem:

```
Collection: sales
- idTenant ASC, idBranch ASC, deletedAt ASC, createdAt DESC

Collection: receivables
- idTenant ASC, idBranch ASC, status ASC, dueDate ASC

Collection: payables
- idTenant ASC, idBranch ASC, status ASC, dueDate ASC

Collection: sessions
- idTenant ASC, idBranch ASC, idClass ASC, sessionDate ASC, deletedAt ASC

Collection: enrollments
- idTenant ASC, idBranch ASC, idClient ASC, status ASC

Collection: trainingPlans
- idTenant ASC, idBranch ASC, date ASC, deletedAt ASC
```

### Migração de Dados
- [ ] Dados de produção compatíveis com novo schema?
- [ ] Script de migração necessário?
- [ ] Backup antes da migração

---

## ⚡ 5. Performance

### Otimizações Aplicadas
- [x] Lazy loading de componentes
- [x] Memoização com `useMemo` e `useCallback`
- [x] Consultas Firestore otimizadas (limits, índices)
- [x] Cache de dados onde apropriado

### Monitoramento
- [ ] Firebase Performance Monitoring habilitado
- [ ] Google Analytics configurado
- [ ] Error tracking (Sentry/similares) configurado

---

## 🚨 6. Tratamento de Erros

### Verificações
- [x] Toast notifications em operações críticas
- [x] Try/catch em chamadas assíncronas
- [x] Mensagens de erro amigáveis
- [x] Fallbacks para estados de erro

### Console Logs
- [ ] Remover `console.log` de desenvolvimento (opcional)
- [x] Manter apenas `console.error` e `console.warn` relevantes

---

## 📦 7. Deploy

### Pré-Deploy
- [ ] Criar tag de versão no Git
- [ ] Documentar changelog
- [ ] Notificar stakeholders

### Firebase Hosting
```bash
# Build de produção
npm run build

# Deploy
firebase deploy --only hosting

# OU deploy completo (hosting + functions + firestore rules)
firebase deploy
```

### Rollback Plan
- [ ] Versão anterior disponível
- [ ] Procedimento de rollback documentado
- [ ] Backup do banco disponível

---

## 📝 8. Pós-Deploy

### Smoke Tests
- [ ] Acessar URL de produção
- [ ] Fazer login
- [ ] Testar fluxo crítico (ex: criar venda)
- [ ] Verificar logs no Firebase Console

### Monitoramento (Primeiras 24h)
- [ ] Erros no Console do Firebase
- [ ] Feedback de usuários
- [ ] Performance na produção
- [ ] Taxa de erro em operações

---

## 🎯 Checklist Rápido Final

**Antes de fazer deploy, confirme:**

- [x] ✅ Build passa sem erros
- [x] ✅ Todas as datas usam `normalizeDate`
- [x] ✅ Contexto tenant/branch funciona corretamente
- [ ] ⚠️ Testes manuais das funcionalidades críticas
- [ ] ⚠️ Índices do Firestore criados
- [ ] ⚠️ Variáveis de ambiente validadas
- [ ] ⚠️ Backup do banco realizado
- [ ] ⏳ Deploy para staging primeiro (se disponível)
- [ ] ⏳ Smoke tests após deploy

---

## 🔥 Comandos Úteis

```bash
# Build local
npm run build

# Testar build localmente
npx serve -s build

# Deploy apenas hosting
firebase deploy --only hosting

# Deploy completo
firebase deploy

# Ver logs de produção
firebase functions:log

# Criar backup do Firestore
gcloud firestore export gs://[BUCKET_NAME]/[EXPORT_FOLDER]
```

---

## 📞 Suporte

Em caso de problemas pós-deploy:

1. Verificar logs: Firebase Console > Functions > Logs
2. Verificar erros: Firebase Console > Crashlytics (se configurado)
3. Rollback se necessário
4. Documentar issue para correção

---

**Última atualização:** {{ datetime.now() }}
**Versão:** 3.0.0
**Branch:** new_financial_branch
