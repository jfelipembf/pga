# 🗄️ Gerenciamento de Estado - Redux Toolkit

## 📋 Índice

1. [Por que Redux?](#por-que-redux)
2. [Estrutura da Store](#estrutura-da-store)
3. [Slices Principais](#slices-principais)
4. [Context API - Quando Usar](#context-api---quando-usar)
5. [Padrões e Boas Práticas](#padrões-e-boas-práticas)

---

## 🎯 Por que Redux?

### **Redux vs Context API**

| Aspecto | Redux Toolkit | Context API |
|---------|--------------|-------------|
| **Complexidade** | Média | Baixa |
| **Performance** | ✅ Excelente | ⚠️ Re-renders |
| **DevTools** | ✅ Redux DevTools | ❌ Não tem |
| **Middleware** | ✅ Thunks, Sagas | ❌ Manual |
| **Escalabilidade** | ✅ Alta | ⚠️ Limitada |
| **Time Travel** | ✅ Sim | ❌ Não |
| **Persist** | ✅ redux-persist | ⚠️ Manual |

### **Decisão: Redux Toolkit**

**Use Redux para:**
- ✅ Estado global da aplicação (tenant, branch, auth)
- ✅ Estado compartilhado entre múltiplas páginas
- ✅ Estado que precisa persistir (localStorage)
- ✅ Estado que precisa de histórico/debug

**Use Context para:**
- ✅ Temas (dark/light mode)
- ✅ Internacionalização (i18n)
- ✅ Toasts/Notificações
- ✅ Estado de UI local (modals, dropdowns)

---

## 🏗️ Estrutura da Store

### **Configuração Principal**

```javascript
// store/index.js

import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import rootReducer from './rootReducer'

// Configuração de persistência
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['tenant', 'auth', 'ui'], // Apenas estes serão persistidos
  blacklist: ['loading'] // Estes NÃO serão persistidos
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorar ações do redux-persist
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    }),
  devTools: process.env.NODE_ENV !== 'production'
})

export const persistor = persistStore(store)
```

```javascript
// store/rootReducer.js

import { combineReducers } from '@reduxjs/toolkit'
import tenantReducer from './tenant/tenantSlice'
import authReducer from './auth/authSlice'
import uiReducer from './ui/uiSlice'
import permissionsReducer from './permissions/permissionsSlice'

const rootReducer = combineReducers({
  tenant: tenantReducer,
  auth: authReducer,
  ui: uiReducer,
  permissions: permissionsReducer
})

export default rootReducer
```

---

## 📦 Slices Principais

### **1. Tenant Slice (Contexto Multitenant)**

```javascript
// store/tenant/tenantSlice.js

import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  idTenant: null,
  tenantSlug: null,
  tenantName: null,
  idBranch: null,
  branchSlug: null,
  branchName: null,
  isLoaded: false,
  error: null
}

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setTenantContext: (state, action) => {
      const { idTenant, tenantSlug, tenantName, idBranch, branchSlug, branchName } = action.payload
      
      state.idTenant = idTenant
      state.tenantSlug = tenantSlug
      state.tenantName = tenantName
      state.idBranch = idBranch
      state.branchSlug = branchSlug
      state.branchName = branchName
      state.isLoaded = true
      state.error = null
      
      // Salvar no localStorage para acesso direto
      localStorage.setItem('idTenant', idTenant)
      localStorage.setItem('idBranch', idBranch)
      localStorage.setItem('tenantSlug', tenantSlug)
      localStorage.setItem('branchSlug', branchSlug)
    },
    
    clearTenantContext: (state) => {
      Object.assign(state, initialState)
      
      // Limpar localStorage
      localStorage.removeItem('idTenant')
      localStorage.removeItem('idBranch')
      localStorage.removeItem('tenantSlug')
      localStorage.removeItem('branchSlug')
    },
    
    setTenantError: (state, action) => {
      state.error = action.payload
      state.isLoaded = true
    }
  }
})

export const { setTenantContext, clearTenantContext, setTenantError } = tenantSlice.actions
export default tenantSlice.reducer
```

```javascript
// store/tenant/tenantSelectors.js

import { createSelector } from '@reduxjs/toolkit'

// Seletores básicos
export const selectTenant = (state) => state.tenant
export const selectidTenant = (state) => state.tenant.idTenant
export const selectidBranch = (state) => state.tenant.idBranch

// Seletor memoizado para contexto completo
export const selectTenantContext = createSelector(
  [selectTenant],
  (tenant) => ({
    idTenant: tenant.idTenant,
    idBranch: tenant.idBranch,
    tenantSlug: tenant.tenantSlug,
    branchSlug: tenant.branchSlug,
    isLoaded: tenant.isLoaded
  })
)

// Seletor para verificar se contexto está pronto
export const selectIsContextReady = createSelector(
  [selectTenant],
  (tenant) => tenant.isLoaded && tenant.idTenant && tenant.idBranch
)
```

---

### **2. Auth Slice (Autenticação)**

```javascript
// store/auth/authSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from '../../data/firebase/config'

// Thunk assíncrono para login
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password, tenantSlug, branchSlug }, { rejectWithValue }) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // Buscar dados do usuário no Firestore
      const userDoc = await getUserData(user.uid, tenantSlug, branchSlug)
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        ...userDoc
      }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

// Thunk para logout
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await signOut(auth)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload
      state.isAuthenticated = !!action.payload
    },
    clearAuth: (state) => {
      Object.assign(state, initialState)
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        Object.assign(state, initialState)
      })
  }
})

export const { setUser, clearAuth } = authSlice.actions
export default authSlice.reducer
```

```javascript
// store/auth/authSelectors.js

import { createSelector } from '@reduxjs/toolkit'

export const selectAuth = (state) => state.auth
export const selectUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated

// Seletor memoizado para dados do usuário
export const selectUserProfile = createSelector(
  [selectUser],
  (user) => user ? {
    uid: user.uid,
    name: user.displayName || user.name,
    email: user.email,
    avatar: user.photoURL || user.avatar
  } : null
)
```

---

### **3. Permissions Slice (Permissões)**

```javascript
// store/permissions/permissionsSlice.js

import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  roles: [],
  permissions: [],
  isLoaded: false
}

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    setPermissions: (state, action) => {
      const { roles, permissions } = action.payload
      state.roles = roles || []
      state.permissions = permissions || []
      state.isLoaded = true
    },
    
    clearPermissions: (state) => {
      Object.assign(state, initialState)
    }
  }
})

export const { setPermissions, clearPermissions } = permissionsSlice.actions
export default permissionsSlice.reducer
```

```javascript
// store/permissions/permissionsSelectors.js

import { createSelector } from '@reduxjs/toolkit'

export const selectPermissions = (state) => state.permissions
export const selectRoles = (state) => state.permissions.roles
export const selectPermissionsList = (state) => state.permissions.permissions

// Seletor para verificar permissão específica
export const makeSelectHasPermission = () => 
  createSelector(
    [selectPermissionsList, (_, permission) => permission],
    (permissions, permission) => permissions.includes(permission)
  )

// Seletor para verificar role
export const makeSelectHasRole = () =>
  createSelector(
    [selectRoles, (_, role) => role],
    (roles, role) => roles.includes(role)
  )
```

---

### **4. UI Slice (Estado de Interface)**

```javascript
// store/ui/uiSlice.js

import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  sidebarOpen: true,
  theme: 'light',
  language: 'pt-BR',
  loading: {
    global: false,
    sections: {}
  }
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload
    },
    
    setTheme: (state, action) => {
      state.theme = action.payload
      document.documentElement.setAttribute('data-theme', action.payload)
    },
    
    setLanguage: (state, action) => {
      state.language = action.payload
    },
    
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload
    },
    
    setSectionLoading: (state, action) => {
      const { section, loading } = action.payload
      state.loading.sections[section] = loading
    }
  }
})

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  setLanguage,
  setGlobalLoading,
  setSectionLoading
} = uiSlice.actions

export default uiSlice.reducer
```

---

## 🎣 Hooks Customizados

### **useTenant Hook**

```javascript
// hooks/useTenant.js

import { useSelector } from 'react-redux'
import { selectTenantContext, selectIsContextReady } from '../store/tenant/tenantSelectors'

export function useTenant() {
  const context = useSelector(selectTenantContext)
  const isReady = useSelector(selectIsContextReady)
  
  return {
    ...context,
    isReady,
    // Helper para construir URLs
    buildUrl: (path) => `/${context.tenantSlug}/${context.branchSlug}${path}`
  }
}
```

### **useAuth Hook**

```javascript
// hooks/useAuth.js

import { useSelector, useDispatch } from 'react-redux'
import { selectAuth, selectUserProfile } from '../store/auth/authSelectors'
import { loginUser, logoutUser } from '../store/auth/authSlice'

export function useAuth() {
  const dispatch = useDispatch()
  const auth = useSelector(selectAuth)
  const userProfile = useSelector(selectUserProfile)
  
  const login = async (credentials) => {
    return dispatch(loginUser(credentials)).unwrap()
  }
  
  const logout = async () => {
    return dispatch(logoutUser()).unwrap()
  }
  
  return {
    user: userProfile,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    error: auth.error,
    login,
    logout
  }
}
```

### **usePermissions Hook**

```javascript
// hooks/usePermissions.js

import { useSelector } from 'react-redux'
import { selectRoles, selectPermissionsList } from '../store/permissions/permissionsSelectors'

export function usePermissions() {
  const roles = useSelector(selectRoles)
  const permissions = useSelector(selectPermissionsList)
  
  const hasPermission = (permission) => {
    return permissions.includes(permission)
  }
  
  const hasRole = (role) => {
    return roles.includes(role)
  }
  
  const hasAnyPermission = (permissionList) => {
    return permissionList.some(p => permissions.includes(p))
  }
  
  const hasAllPermissions = (permissionList) => {
    return permissionList.every(p => permissions.includes(p))
  }
  
  return {
    roles,
    permissions,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions
  }
}
```

---

## 🔄 Context API - Quando Usar

### **Toast Provider (Context)**

```javascript
// contexts/ToastContext.jsx

import { createContext, useContext, useState } from 'react'
import { Toast } from '../components/ui/Toast'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  
  const show = ({ title, description, type = 'info', duration = 3000 }) => {
    const id = Date.now()
    const toast = { id, title, description, type }
    
    setToasts(prev => [...prev, toast])
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }
  
  const success = (title, description) => show({ title, description, type: 'success' })
  const error = (title, description) => show({ title, description, type: 'error' })
  const warning = (title, description) => show({ title, description, type: 'warning' })
  const info = (title, description) => show({ title, description, type: 'info' })
  
  return (
    <ToastContext.Provider value={{ show, success, error, warning, info }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
```

---

## ✅ Padrões e Boas Práticas

### **1. Normalização de Estado**

```javascript
// ❌ Estado aninhado (difícil de atualizar)
{
  clients: [
    {
      id: '1',
      name: 'João',
      contracts: [
        { id: 'c1', value: 1000 },
        { id: 'c2', value: 2000 }
      ]
    }
  ]
}

// ✅ Estado normalizado (fácil de atualizar)
{
  clients: {
    byId: {
      '1': { id: '1', name: 'João', contractIds: ['c1', 'c2'] }
    },
    allIds: ['1']
  },
  contracts: {
    byId: {
      'c1': { id: 'c1', value: 1000, clientId: '1' },
      'c2': { id: 'c2', value: 2000, clientId: '1' }
    },
    allIds: ['c1', 'c2']
  }
}
```

### **2. Seletores Memoizados**

```javascript
// ❌ Cálculo em todo render
function ClientList() {
  const clients = useSelector(state => state.clients.allIds.map(id => state.clients.byId[id]))
  const activeClients = clients.filter(c => c.status === 'active')
  // Re-calcula toda vez!
}

// ✅ Seletor memoizado
const selectActiveClients = createSelector(
  [state => state.clients],
  (clients) => clients.allIds
    .map(id => clients.byId[id])
    .filter(c => c.status === 'active')
)

function ClientList() {
  const activeClients = useSelector(selectActiveClients)
  // Só re-calcula se clients mudarem!
}
```

### **3. Evitar Estado Duplicado**

```javascript
// ❌ Dados duplicados
{
  clients: [...],
  activeClients: [...], // Duplicação!
  inactiveClients: [...] // Duplicação!
}

// ✅ Derive do estado
{
  clients: [...]
}

// Use seletores
const selectActiveClients = createSelector(...)
const selectInactiveClients = createSelector(...)
```

### **4. Ações Descritivas**

```javascript
// ❌ Ações genéricas
{ type: 'UPDATE', payload: data }

// ✅ Ações específicas
{ type: 'clients/updateStatus', payload: { id, status } }
{ type: 'clients/addContract', payload: { clientId, contract } }
```

---

## 📚 Resumo

### **Use Redux para:**
- ✅ Tenant/Branch context (global)
- ✅ Autenticação e usuário
- ✅ Permissões e roles
- ✅ Estado que persiste entre páginas
- ✅ Estado que precisa de debug/time-travel

### **Use Context para:**
- ✅ Toasts/Notificações
- ✅ Temas (dark/light)
- ✅ Internacionalização
- ✅ Modals globais
- ✅ Estado de UI temporário

### **Use Estado Local (useState) para:**
- ✅ Formulários
- ✅ Toggles de UI
- ✅ Estado de componente específico
- ✅ Dados temporários

---

**Versão:** 1.0  
**Data:** Janeiro 2025
