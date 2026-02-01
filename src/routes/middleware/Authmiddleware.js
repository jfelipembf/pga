import React from "react";
import { Navigate, useParams, Outlet } from "react-router-dom";

const Authmiddleware = (props) => {
  const { idTenant, idBranch } = useParams();

  if (!localStorage.getItem("authUser")) {
    const loginPath = idTenant && idBranch ? `/${idTenant}/${idBranch}/login` : "/login";
    return (
      <Navigate to={loginPath} />
    );
  }

  // If used as a wrapper:
  if (props.children) {
    return <React.Fragment>{props.children}</React.Fragment>;
  }

  // If used as a layout route:
  return <Outlet />;
};

export default Authmiddleware;
