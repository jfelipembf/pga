import PropTypes from 'prop-types'
import React from "react"

import { Navigate, Route, Routes } from "react-router-dom"
import { connect } from "react-redux"

// Import Routes all
import { authRoutes } from "./routes/allRoutes"

import TenantRouter from "./routes/TenantRouter"
import { initFirebaseBackend } from "./helpers/firebase_helper"
import { ToastProvider } from "./components/Common/ToastProvider"

// layouts Format
import VerticalLayout from "./components/VerticalLayout/"
import HorizontalLayout from "./components/HorizontalLayout/"
import NonAuthLayout from "./components/NonAuthLayout"

// Import scss
import "./assets/scss/theme.scss"

const firebaseConfig = {
  apiKey: process.env.REACT_APP_APIKEY,
  authDomain: process.env.REACT_APP_AUTHDOMAIN,
  databaseURL: process.env.REACT_APP_DATABASEURL,
  projectId: process.env.REACT_APP_PROJECTID,
  storageBucket: process.env.REACT_APP_STORAGEBUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGINGSENDERID,
  appId: process.env.REACT_APP_APPID,
  measurementId: process.env.REACT_APP_MEASUREMENTID,
}

// init firebase backend
initFirebaseBackend(firebaseConfig)

const App = props => {
  // Force rebuild 2026-01-12 match cache
  // {alert('hiii')}
  //   useEffect(() => {
  //     alert('hii')
  //     document.getElementsByTagName("html")[0].setAttribute("dir", "rtl");
  //   }, [])

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
  return (
    <React.Fragment>
      <ToastProvider>
        <Routes>
          {/* Non-authenticated routes */}
          {authRoutes.map((route, idx) => (
            <Route
              key={idx}
              path={route.path}
              element={
                <NonAuthLayout>
                  {route.component}
                </NonAuthLayout>
              }
            />
          ))}
          {/* Login com tenant/unidade na rota */}
          <Route
            path="/:tenant/:branch/login"
            element={
              <NonAuthLayout>
                {authRoutes.find(r => r.path === "/login")?.component}
              </NonAuthLayout>
            }
          />

          {/* Authenticated routes with tenant/branch context */}
          <Route
            path="/:tenant/:branch/*"
            element={<TenantRouter Layout={Layout} />}
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/pages-404" replace />} />
        </Routes>
      </ToastProvider>
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
