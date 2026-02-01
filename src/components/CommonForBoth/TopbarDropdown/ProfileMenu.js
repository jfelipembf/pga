import React, { useState } from "react"
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

// Actions
import { setActiveBranch } from "../../../store/tenant/actions"

// users
import user1 from "../../../assets/images/users/user-1.jpg"

const ProfileMenu = props => {
  const [menu, setMenu] = useState(false)

  const { activeBranch, branches, setActiveBranch } = props;
  const { idTenant, idBranch } = props.router.params;

  return (
    <React.Fragment>
      <Dropdown
        isOpen={menu}
        toggle={() => setMenu(!menu)}
        className="d-inline-block"
      >
        <DropdownToggle
          className="btn header-item waves-effect"
          id="page-header-user-dropdown"
          tag="button"
        >
          <img
            className="rounded-circle header-profile-user"
            src={user1}
            alt="Header Avatar"
          />
          <span className="d-none d-xl-inline-block ms-1">{activeBranch ? activeBranch.name : "Selecionar Unidade"}</span>
          <i className="mdi mdi-chevron-down d-none d-xl-inline-block"></i>
        </DropdownToggle>
        <DropdownMenu className="dropdown-menu-end">
          <div className="dropdown-header noti-title">
            <h6 className="text-overflow m-0">Minha Conta</h6>
          </div>
          <DropdownItem tag="a" href="/profile">
            <i className="mdi mdi-account-circle font-size-17 text-muted align-middle me-1" />
            {props.t("Profile")}
          </DropdownItem>

          <div className="dropdown-divider" />
          <div className="dropdown-header noti-title">
            <h6 className="text-overflow m-0">Trocar Unidade</h6>
          </div>

          {branches && branches.map((branch, key) => (
            <DropdownItem
              key={key}
              onClick={() => setActiveBranch(branch)}
              className={activeBranch?.idBranch === branch.idBranch ? "bg-light" : ""}
            >
              <i className={`mdi ${activeBranch?.idBranch === branch.idBranch ? 'mdi-check-circle text-success' : 'mdi-store-outline'} font-size-17 text-muted align-middle me-1`} />
              {branch.name}
            </DropdownItem>
          ))}

          <div className="dropdown-divider" />
          <Link to={`/${idTenant}/${idBranch}/logout`} className="dropdown-item text-danger">
            <i className="mdi mdi-power font-size-17 text-muted align-middle me-1 text-danger" />
            <span>{props.t("Logout")}</span>
          </Link>
        </DropdownMenu>
      </Dropdown>
    </React.Fragment>
  )
}

ProfileMenu.propTypes = {
  success: PropTypes.any,
  t: PropTypes.any,
  activeBranch: PropTypes.object,
  branches: PropTypes.array,
  setActiveBranch: PropTypes.func
}

const mapStatetoProps = state => {
  const { error, success } = state.Profile
  const { activeBranch, branches } = state.Tenant
  return { error, success, activeBranch, branches }
}

export default withRouter(
  connect(mapStatetoProps, { setActiveBranch })(withTranslation()(ProfileMenu))
)