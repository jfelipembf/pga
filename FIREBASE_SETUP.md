# Configuração do Firebase para Scripts de Migração

## 🔧 Opção 1: Usar Credenciais Padrão (Recomendado para Desenvolvimento)

### Passo 1: Instalar Dependências
```bash
npm install firebase-admin dotenv
```

### Passo 2: Autenticar com Firebase CLI
```bash
# Instalar Firebase CLI (se ainda não tiver)
npm install -g firebase-tools

# Fazer login
firebase login

# Definir projeto padrão
firebase use --add
```

### Passo 3: Executar Script
```bash
# Dry-run
node migrate-active-to-isActive.js --dry-run

# Execução real
node migrate-active-to-isActive.js --execute
```

---

## 🔐 Opção 2: Usar Service Account (Recomendado para Produção)

Se a Opção 1 não funcionar ou você preferir usar service account:

### Passo 1: Baixar Service Account Key

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Configurações do Projeto** (ícone de engrenagem)
4. Aba **Contas de serviço**
5. Clique em **Gerar nova chave privada**
6. Salve o arquivo como `firebase-service-account.json` na raiz do projeto

### Passo 2: Atualizar Scripts

Edite `migrate-active-to-isActive.js` e `rollback-migration.js`:

```javascript
// Substituir:
admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.REACT_APP_PROJECTID,
    databaseURL: process.env.REACT_APP_DATABASEURL
});

// Por:
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
```

### Passo 3: Executar
```bash
node migrate-active-to-isActive.js --dry-run
```

---

## ⚠️ Troubleshooting

### Erro: "Could not load the default credentials"

**Solução:**
```bash
# Fazer login no Firebase
firebase login

# Ou definir variável de ambiente
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/firebase-service-account.json"
```

### Erro: "Permission denied"

**Solução:**
Verifique se sua conta tem permissões de **Editor** ou **Proprietário** no projeto Firebase.

---

## 🎯 Qual Opção Usar?

| Situação | Opção Recomendada |
|----------|-------------------|
| Desenvolvimento local | Opção 1 (CLI) |
| CI/CD / Produção | Opção 2 (Service Account) |
| Teste rápido | Opção 1 (CLI) |
| Múltiplos desenvolvedores | Opção 2 (Service Account) |

---

## ✅ Verificar Configuração

Teste se está funcionando:

```bash
node -e "require('dotenv').config(); console.log('Project ID:', process.env.REACT_APP_PROJECTID)"
```

Deve mostrar o ID do seu projeto Firebase.
