import React from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";

const Authmiddleware = ({ children }) => {
  const location = useLocation();
  const { tenant, branch } = useParams();
  const isAuthenticated = !!localStorage.getItem("authUser");

  if (!isAuthenticated) {
    const target =
      tenant && branch ? `/${tenant}/${branch}/login` : "/login";

    return (
      <Navigate
        replace
        to={target}
        state={{ from: location }}
      />
    );
  }

  return <React.Fragment>{children}</React.Fragment>;
};

export default Authmiddleware;
