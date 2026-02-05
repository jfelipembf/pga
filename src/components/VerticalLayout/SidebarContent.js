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

const SidebarContent = props => {
  const ref = useRef();

  // Use Centralized Tenant Hook
  const { tenantSlug, branchSlug } = useTenant();

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
            <li>
              <Link to={linkTo("/dashboard")} className="waves-effect">
                <i className="mdi mdi-view-dashboard-outline"></i>
                <span>{props.t("Dashboard")}</span>
              </Link>
            </li>

            <li>
              <Link to={linkTo("/grade")} className="waves-effect">
                <i className="mdi mdi-calendar-clock"></i>
                <span>{props.t("Grade")}</span>
              </Link>
            </li>

            <li>
              <Link to={linkTo("/clients")} className="waves-effect">
                <i className="mdi mdi-account-group-outline"></i>
                <span>{props.t("Clientes")}</span>
              </Link>
            </li>

            <li>
              <Link to={linkTo("/evaluation")} className="waves-effect">
                <i className="mdi mdi-file-check-outline"></i>
                <span>{props.t("Avaliações")}</span>
              </Link>
            </li>

            {/* ========== FINANCEIRO ========== */}
            <li>
              <Link to="/#" className="has-arrow waves-effect">
                <i className="mdi mdi-cash-multiple"></i>
                <span>{props.t("Financeiro")}</span>
              </Link>
              <ul className="sub-menu">
                <li>
                  <Link to={linkTo("/financial/dashboard")}>{props.t("Resumo")}</Link>
                </li>
                <li>
                  <Link to={linkTo("/financial/cashier")}>{props.t("Caixa")}</Link>
                </li>
                <li>
                  <Link to={linkTo("/financial/receivables")}>{props.t("Recebíveis")}</Link>
                </li>
                <li>
                  <Link to={linkTo("/financial/payables")}>{props.t("Pagáveis")}</Link>
                </li>
                <li>
                  <Link to={linkTo("/financial/cash-flow")}>{props.t("Fluxo de Caixa")}</Link>
                </li>
                <li>
                  <Link to={linkTo("/financial/dre")}>{props.t("DRE")}</Link>
                </li>
              </ul>
            </li>

            {/* ========== GERENCIAL ========== */}
            <li>
              <Link to="/#" className="has-arrow waves-effect">
                <i className="mdi mdi-chart-areaspline"></i>
                <span>{props.t("Gerencial")}</span>
              </Link>
              <ul className="sub-menu">
                <li>
                  <Link to={linkTo("/admin/staff")}>{props.t("Colaboradores")}</Link>
                </li>
                <li>
                  <Link to={linkTo("/admin/classes")}>{props.t("Turmas")}</Link>
                </li>
                <li>
                  <Link to={linkTo("/admin/events")}>{props.t("Eventos")}</Link>
                </li>
                <li>
                  <Link to={linkTo("/admin/audit-logs")}>{props.t("Auditoria")}</Link>
                </li>
              </ul>
            </li>

            {/* ========== ADMINISTRATIVO ========== */}
            <li>
              <Link to="/#" className="has-arrow waves-effect">
                <i className="mdi mdi-cog-outline"></i>
                <span>{props.t("Cadastros")}</span>
              </Link>
              <ul className="sub-menu">
                <li>
                  <Link to={linkTo("/admin/activities")}>{props.t("Atividades")}</Link>
                </li>
                <li>
                  <Link to={linkTo("/admin/areas")}>{props.t("Áreas")}</Link>
                </li>
                <li>
                  <Link to={linkTo("/admin/roles")}>{props.t("Cargos")}</Link>
                </li>
                <li>
                  <Link to={linkTo("/admin/evaluation-levels")}>{props.t("Níveis")}</Link>
                </li>
                <li>
                  <Link to={linkTo("/admin/catalog")}>{props.t("Catálogo")}</Link>
                </li>
                <li>
                  <Link to={linkTo("/financial/contracts")}>{props.t("Contratos")}</Link>
                </li>
                <li>
                  <Link to={linkTo("/financial/bank-accounts")}>{props.t("Contas Bancárias")}</Link>
                </li>
                <li>
                  <Link to={linkTo("/financial/acquirers")}>{props.t("Adquirentes")}</Link>
                </li>
              </ul>
            </li>

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
