import PropTypes from 'prop-types'
import React, { useState } from "react"
import { connect } from "react-redux"
import { Link } from "react-router-dom"
import { withTranslation } from "react-i18next"
import { debounce } from "lodash"

// Components
import ProfileMenu from "../CommonForBoth/TopbarDropdown/ProfileMenu"
import ClientAddSearch from "../Common/ClientAddSearch"
import ClientAddModal from "../../pages/Clients/ClientList/ClientAddModal"
import withRouter from "../Common/withRouter"

// Services
import { ClientService } from "../../services/Clients/ClientService"

// Images

import logoIcon from "../../assets/images/logoIcon.png"

// Actions
import {
  showRightSidebarAction,
  toggleLeftmenu,
  changeSidebarType,
} from "../../store/actions"

const Header = props => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [clientModalOpen, setClientModalOpen] = useState(false)

  const { activeTenant, activeBranch } = props

  function tToggle() {
    var body = document.body;
    body.classList.toggle("vertical-collpsed");
    body.classList.toggle("sidebar-enable");
  }

  /* De-bounced Search Implementation */
  const debouncedSearchApi = React.useMemo(
    () => debounce(async (term, tenant, branch) => {
      if (term && term.length >= 3 && tenant?.idTenant && branch?.idBranch) {
        try {
          const results = await ClientService.searchClients(tenant.idTenant, branch.idBranch, term)
          setSearchResults(results)
        } catch (error) {
          console.error("Search error:", error)
          setSearchResults([])
        }
      } else {
        setSearchResults([])
      }
    }, 500),
    []
  );

  const handleSearch = (term) => {
    setSearchQuery(term)
    debouncedSearchApi(term, activeTenant, activeBranch)
  }

  const handleSelectClient = (client) => {
    if (activeTenant?.slug && activeBranch?.slug && props.router?.navigate) {
      props.router.navigate(`/${activeTenant.slug}/${activeBranch.slug}/clients/${client.id}`)
    }
  };

  const handleClientAdded = () => {
    setClientModalOpen(false)
  }


  const dashboardLink = activeTenant?.slug && activeBranch?.slug
    ? `/${activeTenant.slug}/${activeBranch.slug}/dashboard`
    : "/";

  return (
    <React.Fragment>
      <header id="page-topbar">
        <div className="navbar-header">
          <div className="d-flex align-items-center">
            <div className="navbar-brand-box">
              <Link to={dashboardLink} className="logo logo-dark">
                <span className="logo-sm">
                  <img src={logoIcon} alt="" height="60" style={{ filter: "brightness(0) invert(1)", transform: "translateX(-15px)" }} />
                </span>
                <span className="logo-lg">
                  <img src={logoIcon} alt="" height="120" style={{ filter: "brightness(0) invert(1)" }} />
                </span>
              </Link>

              <Link to={dashboardLink} className="logo logo-light">
                <span className="logo-sm">
                  <img src={logoIcon} alt="" height="60" style={{ filter: "brightness(0) invert(1)", transform: "translateX(-15px)" }} />
                </span>
                <span className="logo-lg">
                  <img src={logoIcon} alt="" height="120" style={{ filter: "brightness(0) invert(1)" }} />
                </span>
              </Link>
            </div>

            <button
              type="button"
              onClick={() => {
                tToggle()
              }}
              className="btn btn-sm px-3 font-size-24 header-item waves-effect vertical-menu-btn"
              id="vertical-menu-btn"
            >
              <i className="mdi mdi-menu"></i>
            </button>


          </div>

          <div className="d-flex align-items-center">
            <div className="d-none d-lg-block me-3" style={{ minWidth: '350px' }}>
              <ClientAddSearch
                value={searchQuery}
                onChange={handleSearch}
                candidates={searchResults}
                onSelect={handleSelectClient}
                placeholder="Buscar Aluno (Nome, CPF ou Email)..."
                showNoResults={true}
              />
            </div>

            {/* Action Icons */}
            <div className="d-flex align-items-center gap-1">
              {/* Training TV Mode Button - Removed for now
              <Link
                to={activeTenant && activeBranch ? `/${activeTenant.idTenant}/${activeBranch.idBranch}/training-tv` : "/training-tv"}
                className="btn header-item waves-effect d-flex align-items-center justify-content-center"
                title="Modo TV - Treinos"
                style={{ width: '40px', height: '40px' }}
              >
                <i className="mdi mdi-monitor font-size-24"></i>
              </Link>
              */}

              {/* Add Client Button */}
              <button
                onClick={() => setClientModalOpen(true)}
                className="btn header-item waves-effect d-flex align-items-center justify-content-center"
                title="Novo Aluno"
                style={{ width: '40px', height: '40px' }}
              >
                <i className="mdi mdi-account-plus-outline font-size-24"></i>
              </button>
            </div>

            <ProfileMenu />
          </div>
        </div>
      </header>

      {activeTenant && activeBranch && (
        <ClientAddModal
          isOpen={clientModalOpen}
          toggle={() => setClientModalOpen(!clientModalOpen)}
          onClientAdded={handleClientAdded}
        />
      )}
    </React.Fragment>
  )
}

Header.propTypes = {
  changeSidebarType: PropTypes.func,
  leftMenu: PropTypes.any,
  leftSideBarType: PropTypes.any,
  showRightSidebar: PropTypes.any,
  showRightSidebarAction: PropTypes.func,
  t: PropTypes.any,
  toggleLeftmenu: PropTypes.func,
  activeTenant: PropTypes.object,
  activeBranch: PropTypes.object,
  router: PropTypes.object
}

const mapStatetoProps = state => {
  const {
    layoutType,
    showRightSidebar,
    leftMenu,
    leftSideBarType,
  } = state.Layout
  const { activeTenant, activeBranch } = state.Tenant
  return { layoutType, showRightSidebar, leftMenu, leftSideBarType, activeTenant, activeBranch }
}

export default connect(mapStatetoProps, {
  showRightSidebarAction,
  toggleLeftmenu,
  changeSidebarType,
})(withRouter(withTranslation()(Header)))
