import PropTypes from 'prop-types'
import React, { useEffect } from "react"
import { Outlet } from "react-router-dom"
import { useDispatch } from "react-redux"
import { getTenantDetails } from "../store/tenant/actions"
import withRouter from './Common/withRouter'

const NonAuthLayout = (props) => {
  const dispatch = useDispatch()
  const { idTenant } = props.router.params

  useEffect(() => {
    if (idTenant) {
      dispatch(getTenantDetails(idTenant))
    }
  }, [idTenant, dispatch])

  return (
    <React.Fragment>
      <Outlet />
    </React.Fragment>
  )
}

NonAuthLayout.propTypes = {
  children: PropTypes.any,
  location: PropTypes.object
}

export default withRouter(NonAuthLayout)
