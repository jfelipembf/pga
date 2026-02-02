import PropTypes from 'prop-types'
import React from "react"

import { Route, Routes, Navigate } from "react-router-dom"
import { connect } from "react-redux"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

// Import Routes all
import { userRoutes, authRoutes } from "./routes/allRoutes"

// Import all middleware
import Authmiddleware from "./routes/middleware/Authmiddleware"

// layouts Format
import VerticalLayout from "./components/VerticalLayout/"
import HorizontalLayout from "./components/HorizontalLayout/"
import NonAuthLayout from "./components/NonAuthLayout"

// Import scss
import "./assets/scss/theme.scss"

// Import Firebase Configuration file
import { initFirebaseBackend } from "./helpers/firebase_helper"

import GlobalErrorBoundary from "./components/Common/GlobalErrorBoundary"

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
      <GlobalErrorBoundary>
        <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
        <Routes>
          {/* Dynamic Multitenant Root */}
          <Route path="/:idTenant/:idBranch">

            {/* Public Auth routes within tenant context */}
            <Route element={<NonAuthLayout />}>
              {authRoutes.map((route, idx) => (
                <Route
                  key={idx}
                  path={route.path.startsWith('/') ? route.path.substring(1) : route.path}
                  element={route.component}
                />
              ))}
            </Route>

            {/* Protected routes within tenant context */}
            <Route element={<Authmiddleware><Layout /></Authmiddleware>}>
              {userRoutes.map((route, idx) => (
                <Route
                  key={idx}
                  path={route.path.startsWith('/') ? route.path.substring(1) : route.path}
                  element={route.component}
                />
              ))}
            </Route>
          </Route>

          {/* Global redirects/fallbacks */}
          <Route path="/login" element={<Navigate to="/pages-404" replace />} />
          <Route path="/register" element={<Navigate to="/pages-404" replace />} />
          <Route path="/" element={<Navigate to="/pages-404" replace />} />
          <Route path="/dashboard" element={<Navigate to="/pages-404" replace />} />

          {/* You should define a Catch-all or a landing page route here if possible */}
        </Routes>
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
