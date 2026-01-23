import PropTypes from "prop-types"
import React from "react"

import { connect } from "react-redux"
import { Link, useParams } from "react-router-dom"

// Import menuDropdown

import ProfileMenu from "../CommonForBoth/TopbarDropdown/ProfileMenu"

// import megamenuImg from "../../assets/images/megamenu-img.png"
import pgaLogo from "../../assets/images/pgaLogo.png"
import logoIcon from "../../assets/images/logoIcon.png"

// Import Global Search
import GlobalClientSearch from "../CommonForBoth/GlobalClientSearch"

import ClientAddModal from "../../pages/Clients/Components/ClientAddModal"
import ClientExtraFields from "../../pages/Clients/Components/ClientExtraFields"
import { useClientListActions } from "../../pages/Clients/Hooks/useClientListActions"

const Header = ({ title, breadcrumbItems, toggleMenuCallback }) => {
  const { tenant, branch } = useParams()
  const items = breadcrumbItems || []
  const breadcrumbPath = items.map(item => item.title).join(" / ")


  const {
    modalOpen: clientModalOpen,
    setModalOpen: setClientModalOpen,
    handleModalSubmit: handleClientSubmit,
    isLoading: isClientSubmitting,
    uploading: clientUploading
  } = useClientListActions({})

  return (
    <React.Fragment>
      <header id="page-topbar">
        <div className="navbar-header">
          <div className="d-flex align-items-center flex-wrap">

            {/* Logo Re-added in Header Area */}
            <div className="me-4 d-flex align-items-center">
              <img src={logoIcon} alt="PGA" style={{ height: "120px", width: "auto" }} />
            </div>

            {/* Breadcrumb Removed as requested */}
            {/* 
            {(title || breadcrumbPath) && (
              <div className="ms-3 d-none d-sm-block">
                <h5 className="mb-0 fs-5">{title || breadcrumbPath}</h5>
                {breadcrumbPath && title && <small className="text-muted small">{breadcrumbPath}</small>}
              </div>
            )} 
            */}

          </div>
          <div className="d-flex align-items-center">
            {/* Global Search */}
            <GlobalClientSearch />

            <Link
              to={`/${tenant}/${branch}/training-planning/tv`}
              target="_blank"
              className="btn header-item waves-effect d-flex align-items-center justify-content-center"
              title="Modo TV"
            >
              <i className="mdi mdi-television font-size-22" />
            </Link>

            <button
              type="button"
              onClick={() => setClientModalOpen(true)}
              className="btn header-item waves-effect"
              id="page-header-user-dropdown"
            >
              <i className="mdi mdi-account-plus-outline font-size-22" />
            </button>

            <ProfileMenu />
          </div>
        </div>
      </header>
      <ClientAddModal
        isOpen={clientModalOpen}
        toggle={() => setClientModalOpen(!clientModalOpen)}
        onSubmit={handleClientSubmit}
        renderExtra={props => <ClientExtraFields {...props} />}
        submitting={isClientSubmitting || clientUploading}
      />
    </React.Fragment>
  )
}

Header.propTypes = {
  breadcrumbItems: PropTypes.array,
  title: PropTypes.string,
  toggleMenuCallback: PropTypes.func,
}

const mapStateToProps = state => {
  const breadcrumb = state.Breadcrumb || {}
  return {
    title: breadcrumb.title || "",
    breadcrumbItems: breadcrumb.breadcrumbItems || [],
  }
}

export default connect(mapStateToProps)(Header)
