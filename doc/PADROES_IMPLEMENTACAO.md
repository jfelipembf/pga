# 🛡️ Guia de Implementação e Prevenção de Erros

Este documento reúne lições aprendidas e padrões obrigatórios para a criação de novos módulos, páginas e serviços, visando evitar a recorrência de erros (NaN, Redux incompleto, dependências circulares).

---

## 🏗️ Padrões de Arquitetura (Logic & Data Layer)

### 1. Repositórios e Serviços (Backend Logic)
*   **Isolamento:** Serviços (`Services/*.js`) NUNCA devem importar da UI. Devem importar apenas de `Repositories`, `Schemas` e outros `Services` (ex: `AuditService`).
*   **Repositories:** Devem ser classes puras que estendem `BaseRepository`.
    *   Sempre use `import { query, where, limit, getDocs } from 'firebase/firestore'` explicitamente se for criar consultas customizadas. O `BaseRepository` *não* exporta essas funções.

### 2. Tratamento de Dados (Schemas & Validation)
*   **Validação Rigorosa (Yup):** Todo dado que entra no sistema DEVE ser validado por um schema Yup antes de ser persistido.
    *   **Anti-Pattern:** Confiar que a UI enviou o tipo correto.
    *   **Padrão Seguro:**
    ```javascript
    // Errado
    balance: parseFloat(data.balance) // Retorna NaN se string vazia

    // Correto
    balance: parseFloat(data.balance) || 0 // Retorna 0 se falhar
    ```
*   **Schemas no Servidor:** Use `Schema.validate(data, { abortEarly: false })` dentro do endpoint/serviço.

---

## 🎨 Padrões de Interface (Frontend UI)

### 3. Autenticação e Usuário
*   **NÃO CONFIE NO REDUX PARA DETALHES:** O `state.Login.user` do template PGA atual armazena apenas dados superficiais de sessão.
*   **Padrão Seguro:** Para obter `uid`, `email` ou `role`, sempre leia do `localStorage`:
    ```javascript
    const getAuthUser = () => {
        const authUser = localStorage.getItem("authUser")
        return authUser ? JSON.parse(authUser) : null
    }
    const user = getAuthUser()
    ```
*   **Guard Clauses:** Sempre verifique `if (!user || !user.uid)` antes de qualquer operação crítica.

### 4. Rotapoeamento (Routing)
*   **Breadcrumbs:** Devem ser removidos ou gerados dinamicamente sem dependências quebradas.
*   **Multitenant URL:** Todas as rotas internas devem usar links dinâmicos:
    ```javascript
    // Errado
    navigate('/financeiro/caixa')

    // Correto
    const { idTenant, idBranch } = useParams()
    navigate(`/${idTenant}/${idBranch}/financeiro/caixa`)
    ```

### 5. Feedback Visual (UX)
*   **Toasts Globais:** Use `import { toast } from 'react-toastify'` para sucesso/erro. O `ToastContainer` já está configurado no `App.js`.
*   **Modais:** Limpe o formulário ao fechar o modal ou usar `enableReinitialize: true` no Formik se necessário.

---

## 📝 Checklist para Novos Módulos

Antes de dar o "commit" em um novo módulo (ex: Vendas, Contratos), verifique:

1.  [ ] **Schema Definido:** O arquivo `src/data/schemas/XxxSchema.js` existe e cobre todos os campos?
2.  [ ] **Tipagem Segura:** O Serviço trata `NaN` e `null` para campos numéricos?
3.  [ ] **Auth Correta:** A página obtém o usuário do `localStorage`?
4.  [ ] **Rota Registrada:** Está em `allRoutes.js` e no `SidebarContent.js`?
5.  [ ] **Auditoria:** O `Service` chama `AuditService.log`?

## 🛠️ Formatadores Padrão (Use estes!)

Para manter a consistência visual, **NUNCA** formate datas ou moedas manualmente na UI. Importe dos utilitários centrais:

### Datas (`src/utils/date.js`)
*   `formatDate(date)` -> 30/01/2025
*   `formatDateTime(date)` -> 30/01/2025 14:30
*   `formatRelative(date)` -> há 2 horas

### Moedas e Valores (`src/utils/format.js`)
*   `formatCurrency(1250.5)` -> R$ 1.250,50
*   `formatPercent(0.15)` -> 15,00%

---

## 🚫 Erros Comuns a Evitar

| Erro | Solução Padrão |
| :--- | :--- |
| `ValidationError: ... is NaN` | Tratar input numérico com `parseFloat(x) || 0`. |
| `Cannot read property 'uid' of undefined` | Usar helper `getAuthUser` do LocalStorage, não apenas Redux. |
| `Firebase: No Firebase App '[DEFAULT]'` | Garantir que `initFirebaseBackend` rodou no `App.js` antes de usar serviços. |
| `e.map is not a function` | Ao carregar listas, iniciar estado com `[]` e verificar se a resposta é array. |
