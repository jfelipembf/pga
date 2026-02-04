# Guia de Migração: active → isActive

## 📋 Visão Geral

Este guia explica como migrar todos os documentos das coleções Admin do campo `active` para `isActive`, alinhando com o padrão dos schemas financeiros.

---

## 🔧 Pré-requisitos

### 1. Instalar Dependências

```bash
npm install firebase-admin dotenv
```

### 2. Autenticar com Firebase

**Opção A - Firebase CLI (Mais Fácil):**
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Fazer login
firebase login

# Definir projeto
firebase use --add
```

**Opção B - Service Account:**
Veja instruções detalhadas em `FIREBASE_SETUP.md`

---

## 🚀 Como Executar

### Passo 1: Teste em Modo Dry-Run (Recomendado)

Primeiro, execute em modo dry-run para ver o que será alterado **SEM fazer mudanças reais**:

```bash
node migrate-active-to-isActive.js --dry-run
```

ou simplesmente:

```bash
node migrate-active-to-isActive.js
```

**O que acontece:**
- ✅ Mostra todos os documentos que seriam migrados
- ✅ Exibe estatísticas detalhadas
- ❌ **NÃO faz alterações no banco**

### Passo 2: Executar Migração Real

Após verificar que está tudo correto, execute a migração:

```bash
node migrate-active-to-isActive.js --execute
```

**O que acontece:**
- ✅ Cria backups automáticos de todas as coleções
- ✅ Migra `active` → `isActive` em todos os documentos
- ✅ Remove o campo `active` antigo
- ✅ Gera logs detalhados

---

## 📦 Coleções Afetadas

O script migra as seguintes coleções:

1. ✅ `roles` (Funções/Cargos)
2. ✅ `activities` (Atividades)
3. ✅ `areas` (Áreas)
4. ✅ `staff` (Colaboradores)
5. ✅ `classes` (Turmas)
6. ✅ `catalog` (Catálogo)
7. ✅ `evaluationLevels` (Níveis de Avaliação)

---

## 💾 Backups

### Localização

Todos os backups são salvos em:
```
/migration-backups/
```

### Formato dos Arquivos

```
{collection}_{tenantId}_{branchId}_{timestamp}.json
```

Exemplo:
```
roles_tenant123_branch456_2026-02-03T14-30-00-000Z.json
```

### Restaurar Backup (Se Necessário)

Caso precise reverter a migração, use o script de rollback:

```bash
node rollback-migration.js --backup-file migration-backups/roles_tenant123_branch456_2026-02-03T14-30-00-000Z.json
```

---

## 📊 Exemplo de Saída

### Dry-Run:
```
╔════════════════════════════════════════════════════════════╗
║   MIGRAÇÃO: active → isActive                              ║
╚════════════════════════════════════════════════════════════╝

⚠️  MODO DRY-RUN ATIVADO - Nenhuma alteração será feita

📍 Encontrados 2 tenant/branch combinações

============================================================
🏢 Tenant: tenant123 | Branch: branch456
============================================================

📦 Processando: roles (tenant: tenant123, branch: branch456)
   ✅ role1: active=true → isActive=true
   ✅ role2: active=false → isActive=false
   ⏭️  role3: already_migrated

   📊 Resumo: 2 migrados, 1 pulados, 0 erros

...

╔════════════════════════════════════════════════════════════╗
║   RESUMO FINAL DA MIGRAÇÃO                                 ║
╚════════════════════════════════════════════════════════════╝

📊 Coleções processadas: 14
📄 Documentos totais: 156
✅ Migrados: 145
⏭️  Pulados: 11
❌ Erros: 0

⚠️  Esta foi uma execução DRY-RUN. Nenhuma alteração foi feita.
```

---

## ⚠️ Segurança

### O script é seguro porque:

1. ✅ **Modo dry-run por padrão** - você precisa usar `--execute` explicitamente
2. ✅ **Backups automáticos** - antes de qualquer alteração
3. ✅ **Logs detalhados** - de cada operação
4. ✅ **Validações** - pula documentos já migrados
5. ✅ **Rollback disponível** - pode reverter se necessário

---

## 🔍 Verificação Pós-Migração

Após executar a migração, verifique no Firebase Console:

1. Abra uma coleção (ex: `roles`)
2. Verifique que os documentos têm `isActive` (não `active`)
3. Confirme que os valores foram preservados corretamente

---

## 🆘 Troubleshooting

### Erro: "Cannot find module 'firebase-admin'"

**Solução:**
```bash
npm install firebase-admin
```

### Erro: "Cannot find module './firebase-service-account.json'"

**Solução:**
Baixe o arquivo de credenciais do Firebase Console (veja Pré-requisitos)

### Erro: "Permission denied"

**Solução:**
Verifique se a conta de serviço tem permissões de leitura/escrita no Firestore

---

## 📝 Notas Importantes

1. **Não execute em produção sem testar em desenvolvimento primeiro**
2. **Sempre execute dry-run antes da migração real**
3. **Guarde os backups por pelo menos 30 dias**
4. **Monitore a aplicação após a migração**

---

## ✅ Checklist de Execução

- [ ] Baixar `firebase-service-account.json`
- [ ] Instalar `firebase-admin`
- [ ] Executar dry-run
- [ ] Revisar logs do dry-run
- [ ] Executar migração real com `--execute`
- [ ] Verificar backups foram criados
- [ ] Testar aplicação após migração
- [ ] Verificar no Firebase Console
- [ ] Atualizar Services para usar `isActive`

---

## 🎯 Próximos Passos

Após a migração do banco, você precisa atualizar os **Services** para usar `isActive`:

```javascript
// Antes:
active: data.active !== false

// Depois:
isActive: data.isActive !== false
```

Quer que eu crie um script para atualizar todos os Services automaticamente?
