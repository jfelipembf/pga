# 🔧 Guia de Resolução de Problemas Comuns

## 📍 Problema: "Contexto de idTenant/idBranch é obrigatório"

### Sintoma
```
Error: Contexto de idTenant/idBranch é obrigatório para esta operação.
```

### Causa
Hook fazendo chamada de API antes do contexto tenant/branch estar pronto.

### Solução
```javascript
// ❌ ERRADO
const { idTenant, idBranch } = useTenant()
useEffect(() => {
    fetchData(idTenant, idBranch) // Pode executar antes de isReady
}, [idTenant, idBranch])

// ✅ CORRETO
const { idTenant, idBranch, isReady } = useTenant()
useEffect(() => {
    if (!isReady) return
    fetchData(idTenant, idBranch)
}, [isReady, idTenant, idBranch])
```

---

## 📍 Problema: Datas salvando como String no Firestore

### Sintoma
- Datas aparecem como texto no Firestore
- Problemas de timezone
- Ordenação de datas incorreta

### Causa
Usar `new Date()` diretamente sem normalização.

### Solução
```javascript
// ❌ ERRADO
await repository.create(idTenant, idBranch, {
    createdAt: new Date()
})

// ✅ CORRETO
import { normalizeDate } from '../../utils/date'

await repository.create(idTenant, idBranch, {
    createdAt: normalizeDate(new Date())
})
```

---

## 📍 Problema: Calendário em Inglês

### Sintoma
Meses e dias da semana aparecem em inglês.

### Solução
```javascript
import ReactDatePicker, { registerLocale } from "react-datepicker"
import { ptBR } from 'date-fns/locale'

// Registrar locale
registerLocale('pt-BR', ptBR)

// Usar no componente
<ReactDatePicker
    locale="pt-BR"
    // ... outras props
/>
```

---

## 📍 Problema: Build Falha com "not found"

### Sintoma
```
File '...Training/index.js' not found
```

### Causa
Cache do TypeScript/ESLint com referências antigas.

### Solução
```bash
# Limpar cache
rm -rf node_modules/.cache .eslintcache

# Reiniciar servidor de desenvolvimento
npm start
```

---

## 📍 Problema: Hook com Loop Infinito

### Sintoma
- Página trava
- Console mostra centenas de renders

### Causa Comum
Dependência instável em `useEffect` ou `useCallback`.

### Solução
```javascript
// ❌ ERRADO - formik muda toda hora
useEffect(() => {
    // ...
}, [formik])

// ✅ CORRETO - dependências específicas
useEffect(() => {
    // ...
}, [formik.values.specificField])
```

---

## 📍 Problema: Dados Não Carregam Após Login

### Verificar
1. LocalStorage tem `authUser`?
2. Redux tem `activeTenant` e `activeBranch`?
3. URL tem `/:idTenant/:idBranch/`?

### Solução
```javascript
// Verificar no console do navegador
console.log('Auth:', localStorage.getItem('authUser'))
console.log('Redux:', store.getState().Tenant)
console.log('URL:', window.location.pathname)
```

---

## 📍 Problema: Permissões Não Funcionam

### Verificar
1. Usuário tem role associada?
2. Role tem a permission correta?
3. Rota está protegida com permission?

### Arquivo de Configuração
```javascript
// src/routes/allRoutes.js
{
    path: "/training",
    component: <TrainingPlanning />,
    permission: "management_training_manage" // ← Necessário
}
```

---

## 📍 Problema: Firebase Rules Negam Acesso

### Sintoma
```
Missing or insufficient permissions
```

### Verificar Rules
```javascript
// firestore.rules
match /sales/{saleId} {
    allow read, write: if isAuthenticated() 
        && belongsToTenant()
        && hasPermission('finance_manage');
}
```

### Testar no Emulador
```bash
firebase emulators:start
# Acessar: http://localhost:4000/firestore
```

---

## 📍 Problema: Módulo Não Encontrado

### Sintoma
```
Module not found: Can't resolve './utils/someFile'
```

### Checklist
1. Arquivo existe no caminho especificado?
2. Import path está correto (case-sensitive)?
3. Extensão do arquivo está correta (.js, .jsx)?

### Solução Comum
```javascript
// ❌ ERRADO - caminho incorreto
import { func } from './Utils/file'

// ✅ CORRETO
import { func } from './utils/file'
```

---

## 🔥 Comandos de Debug Rápido

```bash
# Verificar erros de lint
npm run lint

# Build para ver todos os erros
npm run build

# Limpar tudo e recomeçar
rm -rf node_modules package-lock.json
npm install

# Ver logs do Firebase (produção)
firebase functions:log --only functionName

# Testar localmente com build de produção
npm run build
npx serve -s build
```

---

## 📞 Quando Pedir Ajuda

Se após tentar as soluções acima o problema persistir:

1. **Copie** a mensagem de erro completa
2. **Capture** screenshot se relevante
3. **Liste** os passos que levaram ao erro
4. **Inclua** versão do Node/npm (`node -v`, `npm -v`)
5. **Verifique** se já existe issue similar no projeto

---

**Documentação Completa:** [Link para docs do projeto]
