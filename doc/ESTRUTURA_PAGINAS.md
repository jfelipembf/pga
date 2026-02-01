# 📄 Estrutura de Páginas e Rotas

## 📋 Índice

1. [Estrutura de Rotas](#estrutura-de-rotas)
2. [Módulos Principais](#módulos-principais)
3. [Permissões e Acesso](#permissões-e-acesso)
4. [Layouts](#layouts)
5. [Navegação](#navegação)

---

## 🗺️ Estrutura de Rotas

### **Padrão de URL Multitenant**

```
/:tenant/:branch/*
```

**Exemplos:**
```
/academia-fit/unidade-centro/dashboard
/academia-fit/unidade-centro/clients
/academia-fit/unidade-centro/financial/payments
/escola-tech/matriz/settings/users
```

### **Mapa Completo de Rotas**

```
/:tenant/:branch/
├── dashboard                          # Dashboard principal
├── clients/                           # Gestão de clientes
│   ├── (lista)
│   ├── :id                           # Perfil do cliente
│   ├── :id/contracts                 # Contratos do cliente
│   ├── :id/financial                 # Financeiro do cliente
│   └── :id/evaluations               # Avaliações do cliente
├── contracts/                         # Gestão de contratos
│   ├── (lista)
│   ├── new                           # Novo contrato
│   └── :id                           # Detalhes do contrato
├── financial/                         # Módulo financeiro
│   ├── dashboard                     # Dashboard financeiro
│   ├── payments                      # Pagamentos
│   ├── receivables                   # Contas a receber
│   ├── cashier                       # Caixa
│   └── reports                       # Relatórios financeiros
├── enrollments/                       # Matrículas
│   ├── (lista)
│   ├── new                           # Nova matrícula
│   └── :id                           # Detalhes da matrícula
├── classes/                           # Turmas e aulas
│   ├── (lista)
│   ├── :id                           # Detalhes da turma
│   └── schedule                      # Grade de horários
├── staff/                             # Equipe
│   ├── (lista)
│   ├── new                           # Novo funcionário
│   └── :id                           # Perfil do funcionário
├── evaluations/                       # Avaliações físicas
│   ├── (lista)
│   ├── new                           # Nova avaliação
│   └── :id                           # Detalhes da avaliação
├── reports/                           # Relatórios
│   ├── (hub)
│   ├── clients                       # Relatório de clientes
│   ├── financial                     # Relatório financeiro
│   └── attendance                    # Relatório de presença
├── settings/                          # Configurações
│   ├── profile                       # Perfil do usuário
│   ├── users                         # Gestão de usuários
│   ├── permissions                   # Gestão de permissões
│   ├── branch                        # Configurações da unidade
│   └── billing                       # Configurações de cobrança
└── audit-logs/                        # Logs de auditoria
    ├── (lista)
    └── :id                           # Detalhes do log
```

---

## 📦 Módulos Principais

### **1. Dashboard**

**Descrição:** Painel principal com visão geral do negócio.

**Páginas:**
- `DashboardPage` - Métricas gerais, gráficos, atividades recentes

**Componentes Principais:**
```jsx
<DashboardPage>
  <MetricsRow>
    <MetricCard title="Clientes Ativos" value={150} trend="+12%" />
    <MetricCard title="Receita do Mês" value="R$ 45.000" trend="+8%" />
    <MetricCard title="Matrículas" value={89} trend="+5%" />
    <MetricCard title="Taxa de Presença" value="87%" trend="-2%" />
  </MetricsRow>
  
  <ChartsRow>
    <RevenueChart data={revenueData} />
    <ClientsGrowthChart data={clientsData} />
  </ChartsRow>
  
  <ActivityFeed activities={recentActivities} />
</DashboardPage>
```

**Permissões:** `dashboard_view`

---

### **2. Clientes (CRM)**

**Descrição:** Gestão completa de clientes e leads.

**Páginas:**

#### `ClientsListPage`
```jsx
<ClientsListPage>
  <PageHeader>
    <Title>Clientes</Title>
    <Actions>
      <Button onClick={handleExport}>Exportar</Button>
      <Button onClick={handleNew}>Novo Cliente</Button>
    </Actions>
  </PageHeader>
  
  <ClientFilters
    onFilterChange={handleFilterChange}
    filters={['status', 'dateRange', 'search']}
  />
  
  <ClientList
    clients={clients}
    loading={loading}
    onClientClick={handleClientClick}
  />
  
  <Pagination
    currentPage={page}
    totalPages={totalPages}
    onPageChange={handlePageChange}
  />
</ClientsListPage>
```

#### `ClientProfilePage`
```jsx
<ClientProfilePage>
  <ProfileHeader client={client}>
    <Avatar src={client.avatar} />
    <ClientInfo>
      <Name>{client.name}</Name>
      <StatusBadge status={client.status} />
      <ContactInfo email={client.email} phone={client.phone} />
    </ClientInfo>
    <Actions>
      <Button onClick={handleEdit}>Editar</Button>
      <Button onClick={handleDelete} variant="danger">Deletar</Button>
    </Actions>
  </ProfileHeader>
  
  <Tabs>
    <Tab label="Visão Geral">
      <ClientMetrics metrics={metrics} />
      <ClientTimeline events={timeline} />
    </Tab>
    
    <Tab label="Contratos">
      <ContractsList contracts={contracts} />
    </Tab>
    
    <Tab label="Financeiro">
      <ClientFinancial clientId={client.id} />
    </Tab>
    
    <Tab label="Avaliações">
      <EvaluationsList evaluations={evaluations} />
    </Tab>
  </Tabs>
</ClientProfilePage>
```

**Permissões:**
- `clients_view` - Ver clientes
- `clients_create` - Criar clientes
- `clients_edit` - Editar clientes
- `clients_delete` - Deletar clientes
- `clients_export` - Exportar dados

---

### **3. Financeiro**

**Descrição:** Gestão financeira completa.

**Páginas:**

#### `FinancialDashboardPage`
```jsx
<FinancialDashboardPage>
  <FinancialMetrics>
    <MetricCard title="Receita do Mês" value="R$ 45.000" />
    <MetricCard title="A Receber" value="R$ 12.000" />
    <MetricCard title="Recebido" value="R$ 33.000" />
    <MetricCard title="Inadimplência" value="8%" />
  </FinancialMetrics>
  
  <ChartsGrid>
    <RevenueChart />
    <PaymentMethodsChart />
    <CashFlowChart />
  </ChartsGrid>
  
  <RecentTransactions transactions={recentTransactions} />
</FinancialDashboardPage>
```

#### `PaymentsPage`
```jsx
<PaymentsPage>
  <PageHeader>
    <Title>Pagamentos</Title>
    <Button onClick={handleNewPayment}>Novo Pagamento</Button>
  </PageHeader>
  
  <PaymentFilters
    filters={['dateRange', 'method', 'status']}
    onFilterChange={handleFilterChange}
  />
  
  <PaymentList
    payments={payments}
    onPaymentClick={handlePaymentClick}
  />
</PaymentsPage>
```

#### `CashierPage`
```jsx
<CashierPage>
  <CashierHeader>
    {cashier.isOpen ? (
      <>
        <Status>Caixa Aberto</Status>
        <OpenedAt>Aberto às {cashier.openedAt}</OpenedAt>
        <Button onClick={handleCloseCashier}>Fechar Caixa</Button>
      </>
    ) : (
      <Button onClick={handleOpenCashier}>Abrir Caixa</Button>
    )}
  </CashierHeader>
  
  {cashier.isOpen && (
    <>
      <CashierSummary>
        <SummaryCard title="Saldo Inicial" value={cashier.openingBalance} />
        <SummaryCard title="Entradas" value={cashier.totalIn} />
        <SummaryCard title="Saídas" value={cashier.totalOut} />
        <SummaryCard title="Saldo Atual" value={cashier.currentBalance} />
      </CashierSummary>
      
      <TransactionsList transactions={cashier.transactions} />
    </>
  )}
</CashierPage>
```

**Permissões:**
- `financial_view` - Ver financeiro
- `payments_create` - Criar pagamentos
- `payments_cancel` - Cancelar pagamentos
- `cashier_open` - Abrir caixa
- `cashier_close` - Fechar caixa

---

### **4. Configurações**

**Descrição:** Configurações do sistema e da unidade.

**Páginas:**

#### `UsersManagementPage`
```jsx
<UsersManagementPage>
  <PageHeader>
    <Title>Usuários</Title>
    <Button onClick={handleInviteUser}>Convidar Usuário</Button>
  </PageHeader>
  
  <UsersList>
    {users.map(user => (
      <UserCard key={user.id}>
        <Avatar src={user.avatar} />
        <UserInfo>
          <Name>{user.name}</Name>
          <Email>{user.email}</Email>
          <RoleBadge role={user.role} />
        </UserInfo>
        <Actions>
          <Button onClick={() => handleEditUser(user)}>Editar</Button>
          <Button onClick={() => handleDeactivate(user)}>Desativar</Button>
        </Actions>
      </UserCard>
    ))}
  </UsersList>
</UsersManagementPage>
```

#### `PermissionsPage`
```jsx
<PermissionsPage>
  <PageHeader>
    <Title>Permissões</Title>
    <Select value={selectedRole} onChange={handleRoleChange}>
      {roles.map(role => (
        <option key={role.id} value={role.id}>{role.name}</option>
      ))}
    </Select>
  </PageHeader>
  
  <PermissionsMatrix>
    {permissionGroups.map(group => (
      <PermissionGroup key={group.name}>
        <GroupTitle>{group.name}</GroupTitle>
        {group.permissions.map(permission => (
          <PermissionRow key={permission.id}>
            <PermissionLabel>{permission.label}</PermissionLabel>
            <Checkbox
              checked={hasPermission(selectedRole, permission.id)}
              onChange={() => handleTogglePermission(permission.id)}
            />
          </PermissionRow>
        ))}
      </PermissionGroup>
    ))}
  </PermissionsMatrix>
</PermissionsPage>
```

**Permissões:**
- `settings_view` - Ver configurações
- `users_manage` - Gerenciar usuários
- `permissions_manage` - Gerenciar permissões
- `branch_settings` - Configurações da unidade

---

## 🔐 Permissões e Acesso

### **Sistema de Permissões**

```javascript
// constants/permissions.js

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard_view',
  
  // Clientes
  CLIENTS_VIEW: 'clients_view',
  CLIENTS_CREATE: 'clients_create',
  CLIENTS_EDIT: 'clients_edit',
  CLIENTS_DELETE: 'clients_delete',
  CLIENTS_EXPORT: 'clients_export',
  
  // Financeiro
  FINANCIAL_VIEW: 'financial_view',
  PAYMENTS_CREATE: 'payments_create',
  PAYMENTS_CANCEL: 'payments_cancel',
  CASHIER_OPEN: 'cashier_open',
  CASHIER_CLOSE: 'cashier_close',
  
  // Configurações
  SETTINGS_VIEW: 'settings_view',
  USERS_MANAGE: 'users_manage',
  PERMISSIONS_MANAGE: 'permissions_manage',
  
  // Auditoria
  AUDIT_VIEW: 'audit_view'
}
```

### **Roles Predefinidos**

```javascript
// constants/roles.js

export const ROLES = {
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Admin',
    permissions: ['*'] // Todas as permissões
  },
  
  ADMIN: {
    id: 'admin',
    name: 'Administrador',
    permissions: [
      'dashboard_view',
      'clients_view',
      'clients_create',
      'clients_edit',
      'financial_view',
      'payments_create',
      'settings_view',
      'users_manage',
      'audit_view'
    ]
  },
  
  MANAGER: {
    id: 'manager',
    name: 'Gerente',
    permissions: [
      'dashboard_view',
      'clients_view',
      'clients_create',
      'financial_view',
      'payments_create'
    ]
  },
  
  INSTRUCTOR: {
    id: 'instructor',
    name: 'Instrutor',
    permissions: [
      'dashboard_view',
      'clients_view',
      'classes_view',
      'evaluations_view',
      'evaluations_create'
    ]
  },
  
  RECEPTIONIST: {
    id: 'receptionist',
    name: 'Recepcionista',
    permissions: [
      'dashboard_view',
      'clients_view',
      'clients_create',
      'enrollments_view',
      'enrollments_create'
    ]
  }
}
```

### **Componente ProtectedRoute**

```javascript
// components/common/ProtectedRoute.jsx

import { Navigate } from 'react-router-dom'
import { usePermissions } from '@/hooks/usePermissions'

export function ProtectedRoute({ 
  children, 
  permissions = [], 
  requireAll = false 
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()
  
  if (permissions.length === 0) {
    return children
  }
  
  const hasAccess = requireAll
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions)
  
  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />
  }
  
  return children
}
```

**Uso:**
```jsx
<Route 
  path="clients" 
  element={
    <ProtectedRoute permissions={['clients_view']}>
      <ClientsListPage />
    </ProtectedRoute>
  } 
/>

<Route 
  path="settings/permissions" 
  element={
    <ProtectedRoute 
      permissions={['permissions_manage']} 
      requireAll
    >
      <PermissionsPage />
    </ProtectedRoute>
  } 
/>
```

---

## 🎨 Layouts

### **1. TenantLayout (Layout Principal)**

```jsx
// components/layout/TenantLayout.jsx

import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function TenantLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

### **2. AuthLayout (Layout de Autenticação)**

```jsx
// components/layout/AuthLayout.jsx

export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="Logo" className="h-12 mx-auto" />
        </div>
        {children}
      </div>
    </div>
  )
}
```

### **3. EmptyLayout (Sem Layout)**

```jsx
// components/layout/EmptyLayout.jsx

export function EmptyLayout({ children }) {
  return <>{children}</>
}
```

---

## 🧭 Navegação

### **Sidebar Navigation**

```jsx
// components/layout/Sidebar.jsx

import { NavLink } from 'react-router-dom'
import { usePermissions } from '@/hooks/usePermissions'
import { useTenant } from '@/hooks/useTenant'

export function Sidebar() {
  const { hasPermission } = usePermissions()
  const { buildUrl } = useTenant()
  
  const navItems = [
    {
      label: 'Dashboard',
      icon: 'LayoutDashboard',
      path: buildUrl('/dashboard'),
      permission: 'dashboard_view'
    },
    {
      label: 'Clientes',
      icon: 'Users',
      path: buildUrl('/clients'),
      permission: 'clients_view'
    },
    {
      label: 'Contratos',
      icon: 'FileText',
      path: buildUrl('/contracts'),
      permission: 'contracts_view'
    },
    {
      label: 'Financeiro',
      icon: 'DollarSign',
      path: buildUrl('/financial/dashboard'),
      permission: 'financial_view',
      children: [
        {
          label: 'Dashboard',
          path: buildUrl('/financial/dashboard')
        },
        {
          label: 'Pagamentos',
          path: buildUrl('/financial/payments')
        },
        {
          label: 'Caixa',
          path: buildUrl('/financial/cashier'),
          permission: 'cashier_open'
        }
      ]
    },
    {
      label: 'Matrículas',
      icon: 'BookOpen',
      path: buildUrl('/enrollments'),
      permission: 'enrollments_view'
    },
    {
      label: 'Turmas',
      icon: 'Calendar',
      path: buildUrl('/classes'),
      permission: 'classes_view'
    },
    {
      label: 'Equipe',
      icon: 'UserCheck',
      path: buildUrl('/staff'),
      permission: 'staff_view'
    },
    {
      label: 'Relatórios',
      icon: 'BarChart',
      path: buildUrl('/reports'),
      permission: 'reports_view'
    },
    {
      label: 'Configurações',
      icon: 'Settings',
      path: buildUrl('/settings/profile'),
      permission: 'settings_view'
    }
  ]
  
  return (
    <aside className="w-64 bg-white border-r min-h-screen">
      <nav className="p-4">
        {navItems.map(item => {
          if (item.permission && !hasPermission(item.permission)) {
            return null
          }
          
          return (
            <NavItem key={item.path} item={item} />
          )
        })}
      </nav>
    </aside>
  )
}

function NavItem({ item }) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div>
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-2 rounded-lg ${
            isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
          }`
        }
        onClick={() => item.children && setIsOpen(!isOpen)}
      >
        <Icon name={item.icon} />
        <span>{item.label}</span>
        {item.children && (
          <ChevronDown className={isOpen ? 'rotate-180' : ''} />
        )}
      </NavLink>
      
      {item.children && isOpen && (
        <div className="ml-8 mt-1">
          {item.children.map(child => (
            <NavLink
              key={child.path}
              to={child.path}
              className="block px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}
```

### **Breadcrumbs**

```jsx
// components/common/Breadcrumbs.jsx

import { Link, useLocation } from 'react-router-dom'
import { useTenant } from '@/hooks/useTenant'

export function Breadcrumbs() {
  const location = useLocation()
  const { tenantSlug, branchSlug } = useTenant()
  
  const pathnames = location.pathname
    .split('/')
    .filter(x => x && x !== tenantSlug && x !== branchSlug)
  
  const breadcrumbNames = {
    'dashboard': 'Dashboard',
    'clients': 'Clientes',
    'contracts': 'Contratos',
    'financial': 'Financeiro',
    'payments': 'Pagamentos',
    'settings': 'Configurações',
    'users': 'Usuários'
  }
  
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 mb-4">
      <Link to={`/${tenantSlug}/${branchSlug}/dashboard`} className="hover:text-gray-900">
        Início
      </Link>
      
      {pathnames.map((name, index) => {
        const routeTo = `/${tenantSlug}/${branchSlug}/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1
        const label = breadcrumbNames[name] || name
        
        return (
          <div key={name} className="flex items-center gap-2">
            <span>/</span>
            {isLast ? (
              <span className="text-gray-900 font-medium">{label}</span>
            ) : (
              <Link to={routeTo} className="hover:text-gray-900">
                {label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
```

---

## 📱 Responsividade

### **Mobile Navigation**

```jsx
// components/layout/MobileNav.jsx

import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2"
      >
        {isOpen ? <X /> : <Menu />}
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="bg-white w-64 h-full">
            <Sidebar onItemClick={() => setIsOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
```

---

## ✅ Checklist de Implementação

### **Para Cada Página**

- [ ] Criar componente da página
- [ ] Adicionar rota no router
- [ ] Configurar permissões
- [ ] Adicionar item no menu de navegação
- [ ] Implementar breadcrumbs
- [ ] Adicionar loading states
- [ ] Adicionar error states
- [ ] Adicionar empty states
- [ ] Implementar responsividade
- [ ] Criar testes E2E

### **Para Cada Feature**

- [ ] Definir permissões necessárias
- [ ] Criar services
- [ ] Criar hooks
- [ ] Criar componentes
- [ ] Adicionar validações
- [ ] Implementar auditoria
- [ ] Criar testes unitários
- [ ] Criar testes de integração
- [ ] Documentar API

---

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Framework:** React Router v6
