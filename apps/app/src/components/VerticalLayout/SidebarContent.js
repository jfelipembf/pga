import PropTypes from "prop-types"
import React, { useMemo, useRef } from "react"
import SimpleBar from "simplebar-react"
import withRouter from "components/Common/withRouter"
import { Link, useLocation } from "react-router-dom"
import usePermissions from "../../hooks/usePermissions"
import { withTranslation } from "react-i18next"
import useMenuConfig from "./menuConfig"

const SidebarContent = props => {
  const { t } = props
  const ref = useRef()
  const { hasPermission } = usePermissions()
  const location = useLocation();
  const currentPath = location.pathname;

  const searchText = "";

  const menuConfig = useMenuConfig(t);

  // --- Helpers de Rota (Copiados para consistência) ---
  const extractPrefix = (path) => {
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2) return `/${parts[0]}/${parts[1]}`;
    return "";
  };

  const urlPrefix = useMemo(() => extractPrefix(currentPath), [currentPath]);

  const matchPath = (configLink, currentPath) => {
    if (!configLink || configLink === "#") return false;
    if (configLink === currentPath) return true;
    if (currentPath.endsWith(configLink)) return true;
    return currentPath.includes(configLink) && configLink !== "/";
  };

  const buildLink = (link) => {
    if (link.startsWith("http") || link === "#") return link;
    if (link.startsWith(urlPrefix)) return link;
    const cleanPrefix = urlPrefix.endsWith('/') ? urlPrefix.slice(0, -1) : urlPrefix;
    const cleanLink = link.startsWith('/') ? link : '/' + link;
    return `${cleanPrefix}${cleanLink}`;
  };

  // --- Filtragem ---
  const filteredMenu = useMemo(() => {
    const q = searchText.toLowerCase().trim()
    return menuConfig.filter(item => {
      // 1. Permissão Pai
      if (item.permission && !hasPermission(item.permission)) return false
      // 2. Busca
      const matchSelf = item.label.toLowerCase().includes(q);
      const matchChild = item.subMenu && item.subMenu.some(sub => sub.label.toLowerCase().includes(q));

      return matchSelf || matchChild;
    });
  }, [searchText, menuConfig, hasPermission])

  // --- Renderização ---
  const renderItem = (item) => {
    const hasChildren = item.subMenu && item.subMenu.length > 0;

    // Determinar Link de Destino
    let targetLink = "#";
    if (hasChildren) {
      // Se tem filhos, o clique leva para o PRIMEIRO filho válido (com permissão)
      const firstValidChild = item.subMenu.find(sub => {
        if (sub.permission && !hasPermission(sub.permission)) return false;
        return true;
      });
      if (firstValidChild) {
        targetLink = buildLink(firstValidChild.link);
      }
    } else {
      targetLink = buildLink(item.link);
    }

    // Highligth: Se rota atual bate com este item ou algum filho
    const isActive = matchPath(item.link, currentPath) ||
      (hasChildren && item.subMenu.some(sub => matchPath(sub.link, currentPath)));

    return (
      <li key={item.id} className={`${isActive ? "mm-active" : ""}`}>
        <Link
          to={targetLink}
          className={`waves-effect ${isActive ? "active" : ""}`}
        >
          {item.icon && <i className={item.icon}></i>}
          <span>{item.label}</span>
        </Link>
        {/* NÃO RENDERIZAMOS UL.SUB-MENU AQUI - Elas vão para o SubmenuBar no topo */}
      </li>
    )
  }

  return (
    <React.Fragment>
      <style>{`
        .sidebar-search-input::placeholder { color: rgba(255, 255, 255, 0.4) !important; }
        .menu-divider { border-top: 1px solid rgba(255,255,255,0.08); margin: 10px 0; }
        .menu-title { display: none; } /* Ocultar titulos de seção para economizar espaço no modo Rail */
      `}</style>

      <SimpleBar style={{ maxHeight: "100%" }} ref={ref}>
        <div id="sidebar-menu">
          <ul className="metismenu list-unstyled pb-5" id="side-menu">
            {filteredMenu.map(item => {
              if (item.id === 'help') {
                return (
                  <React.Fragment key={item.id}>
                    <li className="menu-divider"></li>
                    {renderItem(item)}
                  </React.Fragment>
                )
              }
              return renderItem(item)
            })}
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