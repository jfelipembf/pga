import PropTypes from 'prop-types'
import React, { Suspense } from "react"

import { Route, Routes, Navigate } from "react-router-dom"
import { connect } from "react-redux"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

// Import Routes from centralized config
import { getProtectedRoutes, getPublicRoutes } from "./config/routes"

// Import all middleware
import Authmiddleware from "./routes/middleware/Authmiddleware"

// layouts Format
import VerticalLayout from "./components/VerticalLayout/"
import HorizontalLayout from "./components/HorizontalLayout/"
import NonAuthLayout from "./components/NonAuthLayout"
import PageLoader from "./components/Common/PageLoader"

// Import scss
import "./assets/scss/theme.scss"

// Import Firebase Configuration file
import { initFirebaseBackend } from "./helpers/firebase_helper"

import GlobalErrorBoundary from "./components/Common/GlobalErrorBoundary"

import { firebaseConfig } from "./helpers/firebase_config"

// init firebase backend
initFirebaseBackend(firebaseConfig)

// Branded Loader is imported from Common

const App = props => {
  // Sincronização de logout entre abas
  React.useEffect(() => {
    const handleSyncLogout = (e) => {
      if (e.key === "authUser" && !e.newValue) {
        window.location.reload()
      }
    }

    window.addEventListener("storage", handleSyncLogout)
    return () => window.removeEventListener("storage", handleSyncLogout)
  }, [])

  function getLayout() {
    let layoutCls = VerticalLayout
    switch (props.layout.layoutType) {
      case "horizontal":
        layoutCls = HorizontalLayout
        break
      default:
        layoutCls = VerticalLayout
        break
    }
    return layoutCls
  }

  const Layout = getLayout()
  const protectedRoutes = getProtectedRoutes()
  const publicRoutes = getPublicRoutes()

  return (
    <React.Fragment>
      <GlobalErrorBoundary>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Dynamic Multitenant Root */}
            <Route path="/:idTenant/:idBranch">

              {/* Public Auth routes within tenant context */}
              <Route element={<NonAuthLayout />}>
                {publicRoutes.map((route, idx) => (
                  <Route
                    key={`public-${idx}`}
                    path={route.path.startsWith('/') ? route.path.substring(1) : route.path}
                    element={
                      <Suspense fallback={<PageLoader />}>
                        {React.isValidElement(route.component)
                          ? route.component
                          : <route.component />
                        }
                      </Suspense>
                    }
                  />
                ))}
              </Route>

              {/* Protected routes within tenant context */}
              <Route element={<Authmiddleware><Layout /></Authmiddleware>}>
                {protectedRoutes.map((route, idx) => (
                  <Route
                    key={`protected-${idx}`}
                    path={route.path.startsWith('/') ? route.path.substring(1) : route.path}
                    element={
                      <Authmiddleware
                        permission={route.permission}
                        permissions={route.permissions}
                      >
                        <Suspense fallback={<PageLoader />}>
                          {React.isValidElement(route.component)
                            ? route.component
                            : <route.component />
                          }
                        </Suspense>
                      </Authmiddleware>
                    }
                  />
                ))}
              </Route>
            </Route>

            {/* Global fallbacks - these need tenant context */}
            <Route path="/login" element={<Navigate to="/pages-404" replace />} />
            <Route path="/register" element={<Navigate to="/pages-404" replace />} />
            <Route path="/" element={<Navigate to="/pages-404" replace />} />
            <Route path="/dashboard" element={<Navigate to="/pages-404" replace />} />

            {/* Catch-all 404 */}
            <Route path="*" element={<Navigate to="/pages-404" replace />} />
          </Routes>
        </Suspense>
      </GlobalErrorBoundary>
    </React.Fragment>
  )
}

App.propTypes = {
  layout: PropTypes.any
}

const mapStateToProps = state => {
  return {
    layout: state.Layout,
  }
}

export default connect(mapStateToProps, null)(App)
