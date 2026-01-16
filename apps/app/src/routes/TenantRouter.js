import React, { useEffect } from "react"
import { Navigate, Route, Routes, useParams } from "react-router-dom"
import { useDispatch } from "react-redux"

import Authmiddleware from "./middleware/Authmiddleware"
import ProtectedRoute from "./middleware/ProtectedRoute"
import { userRoutes } from "./allRoutes"
import { setTenantContext } from "../store/tenant/actions"
import usePermissions from "../hooks/usePermissions"

const TenantRouter = ({ Layout }) => {
  const { tenant, branch } = useParams()
  const dispatch = useDispatch()
  const { hasPermission } = usePermissions()

  useEffect(() => {
    dispatch(setTenantContext({ tenant, branch }))
  }, [tenant, branch, dispatch])

  const defaultPath = hasPermission("dashboards_management_view") ? "dashboard" : "dashboard/operational"

  const fullScreenRoutes = userRoutes.filter(r => r.isFullScreen)
  const standardRoutes = userRoutes.filter(r => !r.isFullScreen)

  const getPath = (route) => route.path.startsWith("/") ? route.path.substring(1) : route.path

  return (
    <Authmiddleware>
      <Routes>
        {/* Full Screen Routes (No Layout) */}
        {fullScreenRoutes.map((route, idx) => (
          <Route
            key={`fs-${idx}`}
            path={getPath(route)}
            element={
              <ProtectedRoute permissions={route.permissions}>
                {route.component}
              </ProtectedRoute>
            }
          />
        ))}

        {/* Standard Routes (Wrapped in Layout) */}
        <Route path="*" element={
          <Layout>
            <Routes>
              {standardRoutes.map((route, idx) => (
                <Route
                  key={`std-${idx}`}
                  path={getPath(route)}
                  element={
                    <ProtectedRoute permissions={route.permissions}>
                      {route.component}
                    </ProtectedRoute>
                  }
                />
              ))}
              <Route index element={<Navigate to={defaultPath} replace />} />
              <Route path="*" element={<Navigate to="/pages-404" replace />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </Authmiddleware>
  )
}

export default TenantRouter
