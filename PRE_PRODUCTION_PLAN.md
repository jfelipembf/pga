# Plano de Ajustes para Produção (PGA Admin)

Este plano detalha as etapas críticas para garantir que a aplicação esteja segura, robusta e pronta para usuários reais.

---

## 1. Segurança e Controle de Acesso (RBAC)

### 1.1 Role-Based Access Control no Sidebar
- **Objetivo**: Garantir que colaboradores vejam apenas o que podem acessar.
- **Ação**: Utilizar `useCurrentUser` e `useTenant` no `SidebarContent.js` para renderizar itens de menu condicionalmente.
- **Status**: [x] Concluído.

### 1.2 Regras de Segurança do Firestore
- **Objetivo**: Impedir vazamento de dados entre empresas (Tenants).
- **Ação**: Implementar `firestore.rules` que validam o UID do usuário no caminho `/tenants/{idTenant}/branches/{idBranch}/staff/{uid}`.
- **Status**: [x] Concluído.

### 1.3 Validação de Senhas
- **Objetivo**: Forçar senhas fortes.
- **Ação**: Implementar schemas do Yup com regex para senhas em `StaffAddModal` e `ChangePasswordModal`.
- **Status**: [ ] Pendente.

---

## 2. Experiência do Usuário (UX) e Consistência

### 2.1 Máscaras de Input (Inputs & Forms)
- **Objetivo**: Padronizar entrada de dados críticos.
- **Ação**: Implementar máscaras para CPF, Telefone e CEP usando `react-input-mask`.
- **Status**: [x] Concluído.

### 2.2 Máscara de Moeda (Real-time)
- **Objetivo**: Exibir valores monetários como `R$ 1.250,50` durante a digitação.
- **Ação**: Criar componente `CurrencyInput` e aplicar em Baixas de Recebíveis/Pagáveis.
- **Status**: [x] Concluído.

### 2.3 Sincronização de Abas
- **Objetivo**: Se o usuário deslogar em uma aba, todas as outras devem reagir.
- **Ação**: Listener de `storage` ou `BroadcastChannel` para detectar alteração no `authUser`.
- status: [x] Concluído.

---

## 3. Robustez e Monitoramento

### 3.1 Error Boundaries
- **Objetivo**: Evitar "White Screen of Death" em caso de falhas de renderização.
- **Ação**: Implementar um `GlobalErrorBoundary` no `App.js`.
- **Status**: [x] Concluído.

### 3.2 Estratégia de Monitoramento
- **Objetivo**: Detectar erros antes do cliente.
- **Ação**: Planejar a integração do **Sentry** para captura de exceções em produção. (Placeholder pronto).
- **Status**: [ ] Pendente.

---

## 4. Auditoria e Cleanup

### 4.1 Revisão de Logs de Auditoria
- **Objetivo**: Garantir que todas as ações críticas (Delete/Update) gerem trilha.
- **Ação**: Auditar salvamentos nos serviços principais (Sales, Financial, Clients).
- **Status**: [x] Revisado.

### 4.2 Sanitização de Código
- **Objetivo**: Limpar o console e remover scripts de desenvolvimento.
- **Ação**: Remover `console.log` de produção e garantir que `SessionCounterFixer` e scripts similares rodem apenas sob flag.
- **Status**: [ ] Pendente.

---

## 5. Resumo de Progresso

- [x] **RBAC no Sidebar:** Filtrar menus com base em permissões e papel ('owner').
- [x] **Segurança no Firestore:** Isolamento de Tenant/Branch implementado via Rules.
- [x] **Máscara de Inputs:** CPF, Telefone e CEP padronizados.
- [x] **Máscara de Moeda:** `CurrencyInput` funcional.
- [x] **Sincronização de Abas:** Logout sincronizado entre abas.
- [x] **Error Boundaries:** Global fallback implementado.
