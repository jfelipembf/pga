import PropTypes from 'prop-types'
import React, { useState } from "react"
import { connect } from "react-redux"
import { Link } from "react-router-dom"
import { withTranslation } from "react-i18next"

// Components
import ProfileMenu from "../CommonForBoth/TopbarDropdown/ProfileMenu"
import ClientAddSearch from "../Common/ClientAddSearch"
import ClientAddModal from "../../pages/Clients/ClientList/ClientAddModal"
import withRouter from "../Common/withRouter"

// Services
import { ClientService } from "../../services/Clients/ClientService"

// Images
import logo from "../../assets/images/pgaLogo.png"
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

  const handleSearch = async (term) => {
    setSearchQuery(term)
    if (term && term.length >= 3 && activeTenant && activeBranch) {
      try {
        const results = await ClientService.searchClients(activeTenant.idTenant, activeBranch.idBranch, term)
        setSearchResults(results)
      } catch (error) {
        console.error("Search error:", error)
        setSearchResults([])
      }
    } else {
      setSearchResults([])
    }
  }

  const handleSelectClient = (client) => {
    if (activeTenant && activeBranch && props.router && props.router.navigate) {
      props.router.navigate(`/${activeTenant.idTenant}/${activeBranch.idBranch}/clients/${client.id}`)
    }
  }

  const handleClientAdded = (newClient) => {
    setClientModalOpen(false)
    if (activeTenant && activeBranch && props.router && props.router.navigate) {
      props.router.navigate(`/${activeTenant.idTenant}/${activeBranch.idBranch}/clients/${newClient.id}`)
    }
  }

  const dashboardLink = activeTenant && activeBranch ? `/${activeTenant.idTenant}/${activeBranch.idBranch}/dashboard` : "/";

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
                  <img src={logo} alt="" height="110" style={{ filter: "brightness(0) invert(1)" }} />
                </span>
              </Link>

              <Link to={dashboardLink} className="logo logo-light">
                <span className="logo-sm">
                  <img src={logoIcon} alt="" height="60" style={{ filter: "brightness(0) invert(1)", transform: "translateX(-15px)" }} />
                </span>
                <span className="logo-lg">
                  <img src={logo} alt="" height="110" style={{ filter: "brightness(0) invert(1)" }} />
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
            <div className="d-none d-lg-block me-2" style={{ minWidth: '350px' }}>
              <ClientAddSearch
                value={searchQuery}
                onChange={handleSearch}
                candidates={searchResults}
                onSelect={handleSelectClient}
                placeholder="Buscar Aluno (Nome, CPF ou Email)..."
                showNoResults={true}
              />
            </div>
            {/* Add Client Button */}
            <button
              onClick={() => setClientModalOpen(true)}
              className="btn header-item waves-effect"
              title="Novo Aluno"
            >
              <i className="mdi mdi-account-plus-outline font-size-24"></i>
            </button>

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
