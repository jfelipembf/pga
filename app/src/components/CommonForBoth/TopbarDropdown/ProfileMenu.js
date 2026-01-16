import React, { useEffect, useState } from "react"
import PropTypes from 'prop-types'
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap"

//i18n
import { withTranslation } from "react-i18next"
// Redux
import { connect } from "react-redux"
import { Link } from "react-router-dom";
import withRouter from "components/Common/withRouter"


const ProfileMenu = props => {
  // Declare a new state variable, which we'll call "menu"
  const [menu, setMenu] = useState(false)

  const readUser = () => {
    try {
      const stored = localStorage.getItem("authUser")
      if (!stored) return null
      const parsed = JSON.parse(stored)
      return parsed
    } catch (e) {
      return null
    }
  }

  const [userData, setUserData] = useState(readUser)

  useEffect(() => {
    const data = readUser()
    setUserData(data)
  }, [])

  const staffName =
    userData?.staff ? [userData.staff.firstName, userData.staff.lastName].filter(Boolean).join(" ") : ""

  const displayName =
    staffName ||
    userData?.displayName ||
    userData?.email ||
    "Usuário"

  const avatar =
    userData?.staff?.photoUrl ||
    userData?.staff?.photo ||
    userData?.photoURL ||
    userData?.photoUrl
  const email = userData?.staff?.email || userData?.email || ""

  return (
    <React.Fragment>
      <Dropdown
        isOpen={menu}
        toggle={() => {
          const data = readUser()
          setUserData(data)
          setMenu(!menu)
        }}
        className="d-inline-block"
      >
        <DropdownToggle
          className="btn header-item waves-effect d-flex align-items-center gap-2"
          id="page-header-user-dropdown"
          tag="button"
        >
          {avatar ? (
            <img
              className="rounded-circle header-profile-user"
              src={avatar}
              alt="Header Avatar"
            />
          ) : (
            <div className="rounded-circle header-profile-user d-flex align-items-center justify-content-center bg-soft-secondary">
              <i className="mdi mdi-account font-size-20 text-secondary" />
            </div>
          )}
          <div className="text-start d-none d-sm-block" style={{ lineHeight: '1.2' }}>
            <span className="d-block fw-bold text-dark font-size-14">{displayName}</span>
            <small className="d-block text-muted" style={{ fontSize: '11px' }}>{email}</small>
          </div>
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          <div className="px-3 pb-2 d-sm-none">
            <div className="fw-semibold">{displayName}</div>
          </div>
          <DropdownItem tag={Link} to="/profile">
            <i className="mdi mdi-account-circle font-size-17 text-muted align-middle me-1" />
            {props.t("Perfil")}
          </DropdownItem>

          <div className="dropdown-divider" />
          <Link to="/logout" className="dropdown-item text-danger">
            <i className="mdi mdi-power font-size-17 text-muted align-middle me-1 text-danger" />
            <span>{props.t("Sair")}</span>
          </Link>
        </DropdownMenu>
      </Dropdown>
    </React.Fragment>
  )
}

ProfileMenu.propTypes = {
  success: PropTypes.any,
  t: PropTypes.any
}

const mapStatetoProps = state => {
  const { error, success } = state.Profile
  return { error, success }
}

export default withRouter(
  connect(mapStatetoProps, {})(withTranslation()(ProfileMenu))
)
