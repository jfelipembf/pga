import React, { useEffect } from "react";
import PropTypes from "prop-types";
import withRouter from "components/Common/withRouter";
import { logoutUser } from "../../store/actions";

//redux
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

const Logout = () => {
  const history = useNavigate();
  const { idTenant, idBranch } = useParams();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(logoutUser(history, idTenant, idBranch));
  }, [dispatch, history, idTenant, idBranch]);

  return <></>;
};

Logout.propTypes = {
  history: PropTypes.object,
};

export default withRouter(Logout);