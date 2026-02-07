import PropTypes from "prop-types"
import React, { useCallback, useEffect, useRef } from "react"

// //Import Scrollbar
import SimpleBar from "simplebar-react"

// MetisMenu
import MetisMenu from "metismenujs"
import withRouter from "components/Common/withRouter"
import { Link } from "react-router-dom"

//i18n
import { withTranslation } from "react-i18next"

// Hooks
import { useTenant } from "../../hooks/useTenant";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { hasPermission, hasAnyPermission, isOwner } from "../../utils/permissions";

const SidebarContent = props => {
  const ref = useRef();

  // Use Centralized Tenant Hook
  const { tenantSlug, branchSlug } = useTenant();

  // Permissions Control
  const user = useCurrentUser();
  const permissions = user?.permissions || {};
  const userIsOwner = isOwner();

  const can = (permission) => userIsOwner || hasPermission(permissions, permission);
  const canAny = (perms) => userIsOwner || hasAnyPermission(permissions, perms);

  const linkTo = (path) => {
    if (path.startsWith("/#") || path === "#") return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/${tenantSlug}/${branchSlug}${cleanPath}`;
  };

  const activateParentDropdown = useCallback((item) => {
    item.classList.add("active");
    const parent = item.parentElement;
    const parent2El = parent.childNodes[1];

    if (parent2El && parent2El.id !== "side-menu") {
      parent2El.classList.add("mm-show");
    }

    if (parent) {
      parent.classList.add("mm-active");
      const parent2 = parent.parentElement;

      if (parent2) {
        parent2.classList.add("mm-show");
        const parent3 = parent2.parentElement;
        if (parent3) {
          parent3.classList.add("mm-active");
          parent3.childNodes[0].classList.add("mm-active");
          const parent4 = parent3.parentElement;
          if (parent4) {
            parent4.classList.add("mm-show");
            const parent5 = parent4.parentElement;
            if (parent5) {
              parent5.classList.add("mm-show");
              parent5.childNodes[0].classList.add("mm-active");
            }
          }
        }
      }
      scrollElement(item);
      return false;
    }
    scrollElement(item);
    return false;
  }, []);

  const removeActivation = (items) => {
    for (var i = 0; i < items.length; ++i) {
      var item = items[i];
      const parent = items[i].parentElement;

      if (item && item.classList.contains("active")) {
        item.classList.remove("active");
      }
      if (parent) {
        const parent2El =
          parent.childNodes && parent.childNodes.lenght && parent.childNodes[1]
            ? parent.childNodes[1]
            : null;
        if (parent2El && parent2El.id !== "side-menu") {
          parent2El.classList.remove("mm-show");
        }

        parent.classList.remove("mm-active");
        const parent2 = parent.parentElement;

        if (parent2) {
          parent2.classList.remove("mm-show");
          const parent3 = parent2.parentElement;
          if (parent3) {
            parent3.classList.remove("mm-active");
            parent3.childNodes[0].classList.remove("mm-active");
            const parent4 = parent3.parentElement;
            if (parent4) {
              parent4.classList.remove("mm-show");
              const parent5 = parent4.parentElement;
              if (parent5) {
                parent5.classList.remove("mm-show");
                parent5.childNodes[0].classList.remove("mm-active");
              }
            }
          }
        }
      }
    }
  };

  const activeMenu = useCallback(() => {
    const pathName = process.env.PUBLIC_URL + props.router.location.pathname;
    let matchingMenuItem = null;
    const ul = document.getElementById("side-menu");
    const items = ul.getElementsByTagName("a");
    removeActivation(items);

    for (let i = 0; i < items.length; ++i) {
      if (pathName === items[i].pathname) {
        matchingMenuItem = items[i];
        break;
      }
    }
    if (matchingMenuItem) {
      activateParentDropdown(matchingMenuItem);
    }
  }, [props.router.location.pathname, activateParentDropdown]);

  useEffect(() => {
    ref.current.recalculate();
  }, []);

  useEffect(() => {
    new MetisMenu("#side-menu");
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    activeMenu();
  }, [activeMenu]);

  function scrollElement(item) {
    if (item) {
      const currentPosition = item.offsetTop;
      if (currentPosition > window.innerHeight) {
        ref.current.getScrollElement().scrollTop = currentPosition - 300;
      }
    }
  }

  return (
    <React.Fragment>
      <SimpleBar style={{ maxHeight: "100%" }} ref={ref}>
        <div id="sidebar-menu">
          <ul className="metismenu list-unstyled" id="side-menu">
            <li className="menu-title">{props.t("Menu")}</li>

            {/* ========== OPERACIONAL ========== */}
            {canAny(['dashboards_management_view', 'dashboards_commercial_view']) && (
              <li>
                <Link to={linkTo("/dashboard")} className="waves-effect">
                  <i className="mdi mdi-view-dashboard-outline"></i>
                  <span>{props.t("Dashboard")}</span>
                </Link>
              </li>
            )}

            {can('grade_manage') && (
              <li>
                <Link to={linkTo("/grade")} className="waves-effect">
                  <i className="mdi mdi-calendar-clock"></i>
                  <span>{props.t("Grade")}</span>
                </Link>
              </li>
            )}

            {canAny(['members_manage', 'crm_view']) && (
              <li>
                <Link to={linkTo("/clients")} className="waves-effect">
                  <i className="mdi mdi-account-group-outline"></i>
                  <span>{props.t("Clientes")}</span>
                </Link>
              </li>
            )}

            {can('management_evaluation_run') && (
              <li>
                <Link to={linkTo("/evaluation")} className="waves-effect">
                  <i className="mdi mdi-file-check-outline"></i>
                  <span>{props.t("Avaliações")}</span>
                </Link>
              </li>
            )}

            {can('management_training_manage') && (
              <li>
                <Link to={linkTo("/training")} className="waves-effect">
                  <i className="mdi mdi-notebook-edit-outline"></i>
                  <span>{props.t("Treinos")}</span>
                </Link>
              </li>
            )}


            {/* ========== FINANCEIRO ========== */}
            {canAny(['financial_cashier', 'financial_cashflow', 'dashboards_financial_view', 'sales_purchase']) && (
              <li>
                <Link to="/#" className="has-arrow waves-effect">
                  <i className="mdi mdi-cash-multiple"></i>
                  <span>{props.t("Financeiro")}</span>
                </Link>
                <ul className="sub-menu">
                  {can('dashboards_financial_view') && (
                    <li>
                      <Link to={linkTo("/financial/dashboard")}>{props.t("Resumo")}</Link>
                    </li>
                  )}
                  {can('financial_cashier') && (
                    <li>
                      <Link to={linkTo("/financial/cashier")}>{props.t("Caixa")}</Link>
                    </li>
                  )}
                  {canAny(['financial_cashflow', 'dashboards_financial_view']) && (
                    <li>
                      <Link to={linkTo("/financial/receivables")}>{props.t("Recebíveis")}</Link>
                    </li>
                  )}
                  {can('financial_cashflow') && (
                    <li>
                      <Link to={linkTo("/financial/payables")}>{props.t("Pagáveis")}</Link>
                    </li>
                  )}
                  {can('financial_cashflow') && (
                    <li>
                      <Link to={linkTo("/financial/cash-flow")}>{props.t("Fluxo de Caixa")}</Link>
                    </li>
                  )}
                  {can('financial_cashflow') && (
                    <li>
                      <Link to={linkTo("/financial/dre")}>{props.t("DRE")}</Link>
                    </li>
                  )}
                </ul>
              </li>
            )}

            {/* ========== GERENCIAL ========== */}
            {canAny(['staff_manage', 'admin_classes', 'management_event_plan', 'management_automations', 'management_audit_log']) && (
              <li>
                <Link to="/#" className="has-arrow waves-effect">
                  <i className="mdi mdi-chart-areaspline"></i>
                  <span>{props.t("Gerencial")}</span>
                </Link>
                <ul className="sub-menu">
                  {can('staff_manage') && (
                    <li>
                      <Link to={linkTo("/admin/staff")}>{props.t("Colaboradores")}</Link>
                    </li>
                  )}
                  {can('admin_classes') && (
                    <li>
                      <Link to={linkTo("/admin/classes")}>{props.t("Turmas")}</Link>
                    </li>
                  )}
                  {can('management_event_plan') && (
                    <li>
                      <Link to={linkTo("/admin/events")}>{props.t("Eventos")}</Link>
                    </li>
                  )}
                  {can('management_automations') && (
                    <li>
                      <Link to={linkTo("/automation")}>{props.t("Inteligência")}</Link>
                    </li>
                  )}
                  {can('management_audit_log') && (
                    <li>
                      <Link to={linkTo("/admin/audit-logs")}>{props.t("Auditoria")}</Link>
                    </li>
                  )}
                </ul>
              </li>
            )}

            {/* ========== ADMINISTRATIVO ========== */}
            {canAny(['admin_activities', 'admin_areas', 'admin_roles', 'management_evaluation_levels', 'admin_catalog', 'admin_contracts', 'admin_settings', 'financial_acquirers']) && (
              <li>
                <Link to="/#" className="has-arrow waves-effect">
                  <i className="mdi mdi-cog-outline"></i>
                  <span>{props.t("Cadastros")}</span>
                </Link>
                <ul className="sub-menu">
                  {can('admin_activities') && (
                    <li>
                      <Link to={linkTo("/admin/activities")}>{props.t("Atividades")}</Link>
                    </li>
                  )}
                  {can('admin_areas') && (
                    <li>
                      <Link to={linkTo("/admin/areas")}>{props.t("Áreas")}</Link>
                    </li>
                  )}
                  {can('admin_roles') && (
                    <li>
                      <Link to={linkTo("/admin/roles")}>{props.t("Cargos")}</Link>
                    </li>
                  )}
                  {can('management_evaluation_levels') && (
                    <li>
                      <Link to={linkTo("/admin/evaluation-levels")}>{props.t("Níveis")}</Link>
                    </li>
                  )}
                  {can('admin_catalog') && (
                    <li>
                      <Link to={linkTo("/admin/catalog")}>{props.t("Catálogo")}</Link>
                    </li>
                  )}
                  {can('admin_contracts') && (
                    <li>
                      <Link to={linkTo("/financial/contracts")}>{props.t("Contratos")}</Link>
                    </li>
                  )}
                  {can('admin_settings') && (
                    <li>
                      <Link to={linkTo("/financial/bank-accounts")}>{props.t("Contas Bancárias")}</Link>
                    </li>
                  )}
                  {can('financial_acquirers') && (
                    <li>
                      <Link to={linkTo("/financial/acquirers")}>{props.t("Adquirentes")}</Link>
                    </li>
                  )}
                </ul>
              </li>
            )}

            {/* ========== AJUDA ========== */}
            <li>
              <Link to="/#" className="waves-effect">
                <i className="mdi mdi-help-circle-outline"></i>
                <span>{props.t("Ajuda")}</span>
              </Link>
            </li>
          </ul>
        </div>
      </SimpleBar>
    </React.Fragment>
  )
}

SidebarContent.propTypes = {
  location: PropTypes.object,
  t: PropTypes.any,
}

export default withRouter(withTranslation()(SidebarContent))
