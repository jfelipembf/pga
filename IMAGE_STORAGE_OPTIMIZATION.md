# 📊 Análise e Otimização de Armazenamento de Imagens

## ✅ PONTOS POSITIVOS DA IMPLEMENTAÇÃO ATUAL

### Arquitetura Centralizada
- ✅ Hook `usePhotoUpload` reutilizado em todo o projeto
- ✅ Serviço único `uploadEntityPhoto` para todos os uploads
- ✅ Organização por entidade (clients, staff, products, activities, events)
- ✅ Estrutura multi-tenant: `tenants/{id}/branches/{id}/{entity}/photos/`

### Boas Práticas Implementadas
- ✅ Timestamp no nome do arquivo evita colisões
- ✅ Sanitização de nomes (`safeFileName`)
- ✅ Prefixos descritivos (avatar, photo, prod, serv)
- ✅ Content-type preservado
- ✅ Validações básicas

---

## 🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. ❌ Imagens Antigas Não São Deletadas

**Problema:** Quando um usuário atualiza sua foto, a imagem antiga permanece no Storage indefinidamente.

**Impacto Financeiro:**
- 1000 usuários × 5 atualizações = 5000 arquivos órfãos
- Custo cresce infinitamente sem limpeza
- Firebase Storage cobra por GB armazenado

**Locais Afetados:**
- `pages/Collaborators/Components/Profile.js`
- `pages/Clients/Hooks/useProfileActions.js`
- `pages/Admin/Collaborators/List.js`
- `pages/Admin/Activities/Hooks/useActivitiesPage.js`

### 2. ❌ Falta Função de Deleção

Não existia função para deletar imagens antigas do Storage.

### 3. ❌ Uploads Órfãos em Caso de Erro

Se o upload falhar após salvar no Storage mas antes de salvar no Firestore, o arquivo fica órfão.

---

## ✅ SOLUÇÕES IMPLEMENTADAS

### 1. Função de Deleção Criada

**Arquivo:** `services/media/photo.service.js`

```javascript
export const deleteEntityPhoto = async (photoUrl) => {
  // Extrai path da URL e deleta do Storage
  // Trata erro 404 graciosamente
  // Retorna true/false
}
```

**Características:**
- ✅ Extrai path automaticamente da URL
- ✅ Trata erro 404 (arquivo já deletado)
- ✅ Logs detalhados para debug
- ✅ Não quebra o fluxo se falhar

### 2. Hook Atualizado com Deleção Automática

**Arquivo:** `hooks/usePhotoUpload.js`

```javascript
const { uploadPhoto, deletePhoto } = usePhotoUpload({ entity: "staff" })

// Uso com deleção automática
await uploadPhoto(file, { 
  deleteOldPhoto: oldPhotoUrl  // Deleta antes de fazer upload
})

// Ou deleção manual
await deletePhoto(photoUrl)
```

**Benefícios:**
- ✅ Deleção automática opcional via parâmetro
- ✅ Continua upload mesmo se deleção falhar
- ✅ API consistente com o resto do projeto

### 3. Exemplo de Uso Implementado

**Arquivo:** `pages/Collaborators/Components/Profile.js`

```javascript
if (formData.avatarFile) {
  const oldPhotoUrl = formData.photo
  photoUrl = await uploadPhoto(formData.avatarFile, { 
    deleteOldPhoto: oldPhotoUrl  // ✅ Deleta foto antiga automaticamente
  })
}
```

---

## 📋 PRÓXIMOS PASSOS RECOMENDADOS

### Prioridade ALTA (Implementar Agora)

#### 1. Aplicar Deleção em Todos os Uploads
Atualizar os seguintes arquivos para usar `deleteOldPhoto`:

- [ ] `pages/Clients/Hooks/useProfileActions.js`
- [ ] `pages/Clients/Hooks/useClientListActions.js`
- [ ] `pages/Admin/Collaborators/List.js`
- [ ] `pages/Admin/Activities/Hooks/useActivitiesPage.js`
- [ ] `pages/Admin/Catalog/Hooks/useCatalogData.js`

**Padrão a seguir:**
```javascript
// ❌ ANTES
if (data.avatarFile) {
  photoUrl = await uploadPhoto(data.avatarFile)
}

// ✅ DEPOIS
if (data.avatarFile) {
  const oldPhotoUrl = data.photo || data.avatar
  photoUrl = await uploadPhoto(data.avatarFile, { 
    deleteOldPhoto: oldPhotoUrl 
  })
}
```

#### 2. Implementar Deleção ao Remover Entidades

Quando deletar um cliente, staff, produto, etc., deletar também suas fotos:

```javascript
// Exemplo: ao deletar cliente
export const deleteClient = async (id) => {
  const client = await getClient(id)
  
  // Deletar foto antes de deletar documento
  if (client.photo) {
    await deleteEntityPhoto(client.photo)
  }
  
  await deleteDoc(clientDoc(db, ctx, id))
}
```

### Prioridade MÉDIA (Próximas Sprints)

#### 3. Cloud Function para Limpeza de Órfãos

Criar função agendada para limpar arquivos órfãos:

```javascript
// functions/src/storage/cleanupOrphans.js
exports.cleanupOrphanedPhotos = functions
  .pubsub
  .schedule('every sunday 03:00')
  .onRun(async () => {
    // 1. Listar todos os arquivos no Storage
    // 2. Verificar se URL existe em algum documento
    // 3. Deletar arquivos sem referência
  })
```

#### 4. Otimização de Imagens

Implementar redimensionamento automático:

```javascript
// Usar Firebase Extensions: Resize Images
// Ou implementar manualmente com Sharp
const resizeImage = async (file) => {
  // Criar versões: thumbnail (150x150), medium (800x800), original
  // Salvar apenas as necessárias
}
```

#### 5. Compressão de Imagens

```javascript
// No frontend, antes do upload
import imageCompression from 'browser-image-compression'

const compressedFile = await imageCompression(file, {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
})
```

### Prioridade BAIXA (Melhorias Futuras)

#### 6. CDN para Imagens

- Usar Firebase Hosting CDN ou Cloudflare
- Cache agressivo para imagens públicas
- Reduz custos de bandwidth

#### 7. Lazy Loading de Imagens

```javascript
<img 
  src={placeholder} 
  data-src={actualImage} 
  loading="lazy"
  className="lazy-image"
/>
```

#### 8. Formato WebP

```javascript
// Converter para WebP (menor tamanho)
const webpFile = await convertToWebP(file)
```

---

## 💰 ESTIMATIVA DE ECONOMIA

### Cenário Atual (SEM deleção)
- 1000 usuários
- 5 atualizações de foto/ano
- Tamanho médio: 500KB
- **Total:** 2.5GB/ano de arquivos órfãos
- **Custo Firebase:** ~$0.026/GB/mês = **$0.78/ano** (crescente)

### Cenário Otimizado (COM deleção)
- Mesmos 1000 usuários
- Apenas 1 foto por usuário armazenada
- **Total:** 500MB constante
- **Custo Firebase:** ~$0.013/mês = **$0.16/ano** (fixo)

### Economia: **~80% de redução** + crescimento controlado

---

## 🔧 COMO TESTAR

### 1. Teste Manual
```javascript
// Console do navegador
const { deleteEntityPhoto } = await import('./services/media/photo.service')

// Testar deleção
await deleteEntityPhoto('https://firebasestorage.googleapis.com/...')
```

### 2. Teste de Upload com Deleção
1. Fazer upload de foto de perfil
2. Verificar URL no Firestore
3. Fazer novo upload
4. Verificar se foto antiga foi deletada no Storage Console

### 3. Verificar Logs
```javascript
// Procurar no console:
// "[deleteEntityPhoto] Foto deletada com sucesso: ..."
// "[usePhotoUpload] Erro ao deletar foto antiga (continuando upload): ..."
```

---

## 📚 REFERÊNCIAS

- [Firebase Storage Pricing](https://firebase.google.com/pricing)
- [Firebase Storage Best Practices](https://firebase.google.com/docs/storage/best-practices)
- [Image Optimization Guide](https://web.dev/fast/#optimize-your-images)

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [x] Criar função `deleteEntityPhoto`
- [x] Atualizar hook `usePhotoUpload` com deleção
- [x] Implementar exemplo em `Profile.js`
- [ ] Aplicar em todos os uploads do projeto
- [ ] Implementar deleção ao remover entidades
- [ ] Criar Cloud Function de limpeza
- [ ] Adicionar compressão de imagens
- [ ] Implementar redimensionamento automático
- [ ] Configurar CDN
- [ ] Adicionar lazy loading

---

**Última atualização:** 21/01/2026
**Responsável:** Sistema de Otimização
