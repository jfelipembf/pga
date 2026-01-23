import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { withTranslation } from "react-i18next";
import usePermissions from "../../hooks/usePermissions";
import useMenuConfig from "./menuConfig";

const SubmenuBar = ({ t }) => {
    const location = useLocation();
    const currentPath = location.pathname;
    const { hasPermission, hasAnyPermission } = usePermissions();
    const menuConfig = useMenuConfig(t);

    // Extrair Tenant/Branch da URL atual
    // Padrão esperado: /tenant/branch/resto...
    const extractPrefix = (path) => {
        const parts = path.split('/').filter(Boolean);
        if (parts.length >= 2) {
            return `/${parts[0]}/${parts[1]}`;
        }
        return "";
    };

    const urlPrefix = useMemo(() => extractPrefix(currentPath), [currentPath]);

    // Função para comparar rotas (ignorando prefixo)
    const matchPath = (configLink, currentPath) => {
        if (!configLink || configLink === "#") return false;
        // Se a rota config for absoluta ou igual
        if (configLink === currentPath) return true;
        // Se a rota atual terminar com a rota config (ex: .../grade termina com /grade)
        // Isso cobre /a2/abc/grade vs /grade
        if (currentPath.endsWith(configLink)) return true;
        // Se a rota atual contém a rota config como segmento principal (para sub-páginas internas)
        return currentPath.includes(configLink) && configLink !== "/";
    };

    // Função para construir link final
    const buildLink = (link) => {
        if (link.startsWith("http") || link === "#") return link;
        // Se já tem prefixo, não adiciona
        if (link.startsWith(urlPrefix)) return link;
        // Evitar duplicar barras
        const cleanPrefix = urlPrefix.endsWith('/') ? urlPrefix.slice(0, -1) : urlPrefix;
        const cleanLink = link.startsWith('/') ? link : '/' + link;
        return `${cleanPrefix}${cleanLink}`;
    };

    // Encontrar o menu pai ativo
    const activeParent = useMemo(() => {
        return menuConfig.find(item => {
            // Verifica nos submenus
            if (item.subMenu) {
                return item.subMenu.some(sub => matchPath(sub.link, currentPath));
            }
            // Verifica no próprio item
            return matchPath(item.link, currentPath);
        });
    }, [menuConfig, currentPath]);

    // Filtrar submenus permitidos
    const subMenuItems = useMemo(() => {
        if (!activeParent) return [];

        if (activeParent.subMenu) {
            return activeParent.subMenu.filter(item => {
                if (item.permission && !hasPermission(item.permission)) return false;
                return true;
            });
        }

        // Se for um item raiz sem filhos, retorna vazio (menu bar mostra só título)
        return [];

    }, [activeParent, hasPermission]);

    // Se não tiver pai ativo, esconde a barra inteira? Ou mostra um placeholder?
    // Se esconder, o layout pula. Melhor esconder se for página login/erro, mas aqui estamos no layout vertical.
    // Vamos mostrar apenas vazio para manter consistência visual se desejado, ou null.
    // Usuário pediu "submenu", se não tem submenu, talvez não deva mostrar nada?

    // ATENÇÃO: Se não mostrar nada, o padding-top de 20px no page-content pode ficar estranho.
    // Mas para login/erro não usa esse layout.

    if (!activeParent) return null;

    return (
        <div className="submenu-bar" style={{ background: '#fff', borderBottom: '1px solid #eef2f7' }}>
            {/* Título do Módulo */}
            <div className="submenu-title">
                {activeParent.icon && <i className={`${activeParent.icon} me-2`}></i>}
                <span className="fw-bold">{activeParent.label}</span>
                {subMenuItems.length > 0 && <span className="mx-2 text-muted">|</span>}
            </div>

            {/* Lista de submenus (se houver) */}
            {subMenuItems.length > 0 && (
                <nav className="submenu-nav">
                    {(() => {
                        // Lógica para encontrar o MELHOR match (o mais específico/longo)
                        // Evita que '/dashboard' fique ativo quando estamos em '/dashboard/operational'
                        let bestMatch = null;
                        let maxLen = -1;

                        subMenuItems.forEach(item => {
                            const tLink = buildLink(item.link);
                            const matches = currentPath === tLink || currentPath.startsWith(tLink + '/');
                            if (matches) {
                                if (tLink.length > maxLen) {
                                    maxLen = tLink.length;
                                    bestMatch = item;
                                }
                            }
                        });

                        return subMenuItems.map(item => {
                            const targetLink = buildLink(item.link);
                            const isActive = bestMatch && bestMatch.id === item.id;

                            return (
                                <Link
                                    key={item.id}
                                    to={targetLink}
                                    className={`submenu-link ${isActive ? 'active' : ''}`}
                                >
                                    {item.label}
                                </Link>
                            )
                        });
                    })()}
                </nav>
            )}
        </div>
    );
};

export default withTranslation()(SubmenuBar);
