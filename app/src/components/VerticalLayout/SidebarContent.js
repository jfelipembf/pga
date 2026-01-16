import PropTypes from "prop-types"
import React, { useCallback, useEffect, useRef, useMemo, useState } from "react"
import SimpleBar from "simplebar-react"
import withRouter from "components/Common/withRouter"
import { Link } from "react-router-dom"
import usePermissions from "../../hooks/usePermissions"
import { withTranslation } from "react-i18next"

const SidebarContent = props => {
  const { t, router } = props
  const ref = useRef()
  const { hasPermission, hasAnyPermission } = usePermissions()

  const [searchText, setSearchText] = useState("")


  const tenant = router?.params?.tenant
  const branch = router?.params?.branch
  const basePath = tenant && branch ? `/${tenant}/${branch}` : ""
  const currentPath = router.location.pathname

  // --- 1. Utilitários ---
  const buildPath = useCallback((path) => {
    if (!path || path === "#") return "#"
    return `${basePath}${path}`.replace(/\/+/g, '/')
  }, [basePath])

  // --- 2. Configuração do Menu ---
  const menuConfig = useMemo(() => [
    {
      id: "dashboard",
      label: t("Dashboard"),
      icon: "mdi mdi-view-dashboard-outline",
      link: "#",
      subMenu: [
        { id: "operational", label: t("Operacional"), icon: "mdi mdi-view-dashboard-outline", link: "/dashboard/operational" },
        { id: "management", label: t("Gerencial"), icon: "mdi mdi-chart-areaspline", link: "/dashboard", permission: "dashboards_management_view" },
      ],
    },
    { id: "grade", label: "Grade", icon: "mdi mdi-table-large", link: "/grade", permission: "grade_manage" },
    { id: "clients", label: "Clientes", icon: "mdi mdi-account-multiple-outline", link: "/clients/list", permission: "members_manage" },
    { id: "trainings", label: "Treinos", icon: "mdi mdi-swim", link: "/training-planning", permission: "members_manage" },
    {
      id: "admin",
      label: "Administrativos",
      icon: "mdi mdi-office-building-outline",
      link: "#",
      anyPermission: ["collaborators_manage", "admin_activities", "admin_contracts", "admin_areas", "admin_roles", "admin_catalog", "admin_classes", "admin_settings"],
      subMenu: [
        { id: "collabs", label: "Colaboradores", link: "/collaborators/list", icon: "mdi mdi-account-multiple-check", permission: "collaborators_manage" },
        { id: "activities", label: "Atividades", link: "/admin/activity", icon: "mdi mdi-clipboard-text-outline", permission: "admin_activities" },
        { id: "contracts", label: "Contratos", link: "/admin/contracts", icon: "mdi mdi-file-document-outline", permission: "admin_contracts" },
        { id: "classes", label: "Turmas", link: "/admin/classes", icon: "mdi mdi-account-clock-outline", permission: "admin_classes" },
        { id: "areas", label: "Áreas", link: "/admin/areas", icon: "mdi mdi-map-marker-radius-outline", permission: "admin_areas" },
        { id: "roles", label: "Cargos e Permissões", link: "/admin/roles", icon: "mdi mdi-shield-account-outline", permission: "admin_roles" },
        { id: "catalog", label: "Produtos e Serviços", link: "/admin/catalog", icon: "mdi mdi-tag-text-outline", permission: "admin_catalog" },
      ],
    },
    {
      id: "financial",
      label: "Financeiro",
      icon: "mdi mdi-cash-multiple",
      link: "#",
      anyPermission: ["financial_cashier", "financial_cashflow", "financial_acquirers"],
      subMenu: [
        { id: "cashier", label: "Caixa", link: "/financial/cashier", icon: "mdi mdi-cash-register", permission: "financial_cashier" },
        { id: "cashflow", label: "Fluxo de Caixa", link: "/financial/cashflow", icon: "mdi mdi-chart-line", permission: "financial_cashflow" },
        { id: "acquirers", label: "Adquirentes", link: "/financial/acquirers", icon: "mdi mdi-credit-card-multiple-outline", permission: "financial_acquirers" },
      ],
    },
    { id: "crm", label: "CRM", icon: "mdi mdi-headset", link: "/crm", permission: "crm_view" },
    {
      id: "gerencial",
      label: "Gerencial",
      icon: "mdi mdi-chart-bar",
      link: "#",
      anyPermission: ["management_event_plan", "management_evaluation_levels", "management_integrations", "management_automations"],
      subMenu: [
        { id: "events", label: "Planejamento de Eventos", link: "/events/planning", icon: "mdi mdi-calendar-star", permission: "management_event_plan" },
        { id: "eval_levels", label: "Níveis de Avaliação", link: "/management/evaluation-levels", icon: "mdi mdi-chart-timeline-variant", permission: "management_evaluation_levels" },
        { id: "integrations", label: "Integrações", link: "/management/integrations", icon: "mdi mdi-api", permission: "management_integrations" },
        { id: "automations", label: "Automações", link: "/management/automations", icon: "mdi mdi-robot-excited-outline", permission: "management_automations" },
        { id: "audit", label: "Logs de Auditoria", link: "/management/audit-log", icon: "mdi mdi-clipboard-list-outline", permission: "management_audit_log" },
      ],
    },
    { id: "settings", label: "Configurações", icon: "mdi mdi-cog-outline", link: "/admin/settings", permission: "admin_settings" },
    { id: "evaluation", label: "Avaliação", icon: "mdi mdi-gesture-tap", link: "/evaluation", permission: "management_evaluation_run" },
    { id: "help", label: "Central de Ajuda", icon: "mdi mdi-help-circle-outline", link: "/help" },
  ], [t])

  // --- 3. Filtragem ---
  const filteredMenu = useMemo(() => {
    const q = searchText.toLowerCase().trim()
    const filterRecursive = (items) => {
      return items.filter(item => {
        if (item.permission && !hasPermission(item.permission)) return false
        if (item.anyPermission && !hasAnyPermission(item.anyPermission)) return false
        return true
      }).map(item => {
        const matchSelf = item.label.toLowerCase().includes(q)
        const children = item.subMenu ? filterRecursive(item.subMenu) : []
        if (matchSelf || children.length > 0) {
          return { ...item, subMenu: children.length > 0 ? children : item.subMenu }
        }
        return null
      }).filter(Boolean)
    }
    return filterRecursive(menuConfig)
  }, [searchText, menuConfig, hasPermission, hasAnyPermission])


  // --- 4. Gerenciamento de Estado ---

  // --- 4. State (Lazy Init) ---
  const [expandedMenuItems, setExpandedMenuItems] = useState(() => {
    // Initial Load: Correctly identify the active parent to prevent flicker
    const parentToOpen = menuConfig.find(item =>
      item.subMenu && item.subMenu.some(sub => buildPath(sub.link) === currentPath)
    )
    return parentToOpen ? [parentToOpen.id] : []
  })

  const toggleMenu = (itemId) => {
    setExpandedMenuItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId)
      }
      return [itemId]
    })
  }

  // Effect: Rota Inicial e Mudanças
  useEffect(() => {
    if (!searchText) {
      const parentToOpen = menuConfig.find(item =>
        item.subMenu && item.subMenu.some(sub => buildPath(sub.link) === currentPath)
      )

      if (parentToOpen) {
        setExpandedMenuItems(prev => {
          if (prev.includes(parentToOpen.id)) {
            return prev
          }
          return [parentToOpen.id]
        })
      }
    }
  }, [currentPath, searchText, menuConfig, buildPath])

  // Effect: Busca
  useEffect(() => {
    if (searchText) {
      const allParentIds = filteredMenu.filter(item => item.subMenu?.length > 0).map(item => item.id)

      // Prevent loop: check if arrays are different before updating
      setExpandedMenuItems(prev => {
        const isSame = prev.length === allParentIds.length && prev.every((val, index) => val === allParentIds[index])
        if (isSame) return prev
        return allParentIds
      })
    }
  }, [searchText, filteredMenu])


  // --- 5. Renderização ---
  const renderItem = (item, isSubItem = false) => {
    const hasChildren = item.subMenu && item.subMenu.length > 0
    const isExpanded = expandedMenuItems.includes(item.id)

    const isExactRoute = buildPath(item.link) === currentPath
    const isParentOfActive = hasChildren && item.subMenu.some(sub => buildPath(sub.link) === currentPath)

    // Cor ativa se: Rota exata OU Filho ativo OU Menu expandido
    const isActiveColor = isExactRoute || isParentOfActive || isExpanded

    return (
      <li key={item.id} className={`${isActiveColor ? "mm-active" : ""}`}>
        <Link
          to={hasChildren ? "#" : buildPath(item.link)}
          className={`waves-effect ${hasChildren ? "has-arrow" : ""} ${isActiveColor ? "active" : ""}`}
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault()
              toggleMenu(item.id)
            } else {
              if (!isSubItem) setExpandedMenuItems([])
            }
          }}
          aria-expanded={isExpanded}
        >
          {item.icon && <i className={item.icon}></i>}
          <span>{item.label}</span>
        </Link>

        {hasChildren && (
          <ul className={`sub-menu mm-collapse ${isExpanded ? "mm-show" : ""}`}>
            {item.subMenu.map(sub => renderItem(sub, true))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <React.Fragment>
      <style>{`
        /* Styles Search & Divider (Custom) */
        .sidebar-search-input::placeholder { color: rgba(255, 255, 255, 0.4) !important; }
        .menu-divider { border-top: 1px solid rgba(255,255,255,0.08); margin: 20px 0; }
        .menu-title { padding: 12px 20px !important; font-size: 11px; text-transform: uppercase; color: rgba(255,255,255,0.5); }
      `}</style>

      <SimpleBar style={{ maxHeight: "100%" }} ref={ref}>
        <div id="sidebar-menu">
          <div className="px-3 py-3 mb-1">
            <div className="position-relative">
              <input
                type="text"
                className="form-control form-control-sm ps-4 sidebar-search-input"
                placeholder="Buscar menu..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "white",
                  boxShadow: "none",
                  borderRadius: "6px"
                }}
              />
              <i className="mdi mdi-magnify position-absolute top-50 start-0 translate-middle-y ms-2 text-white-50"></i>
              {searchText && (
                <i className="mdi mdi-close position-absolute top-50 end-0 translate-middle-y me-2 text-white-50 cursor-pointer" onClick={() => setSearchText("")}></i>
              )}
            </div>
          </div>

          <ul className="metismenu list-unstyled" id="side-menu">
            <li className="menu-title">{t("Menu")}</li>
            {filteredMenu.map(item => {
              if (item.id === 'help') {
                return (
                  <React.Fragment key={item.id}>
                    <li className="menu-divider"></li>
                    <li className="menu-title">Suporte</li>
                    {renderItem(item)}
                  </React.Fragment>
                )
              }
              return renderItem(item)
            })}
            {filteredMenu.length === 0 && searchText && (
              <li className="text-center text-white-50 mt-4"><small>Nenhum resultado.</small></li>
            )}
          </ul>
        </div>
      </SimpleBar>
    </React.Fragment>
  )
}

SidebarContent.propTypes = {
  router: PropTypes.object,
  t: PropTypes.func,
}

export default withRouter(withTranslation()(SidebarContent))