import React from "react"
import ReactDOM from 'react-dom/client';
import App from "./App"
import * as serviceWorker from "./serviceWorker"
import { BrowserRouter } from "react-router-dom"
import "./i18n"
import { Provider } from "react-redux"

import store from "./store"
import { setContextResolver } from "./services/_core/context"

setContextResolver(() => {
  const state = store.getState()
  const idTenant = state?.Tenant?.tenant?.idTenant || state?.Tenant?.tenant?.id || null
  const idBranch =
    state?.Branch?.idBranch ||
    state?.Branch?.activeBranch?.idBranch ||
    state?.Branch?.activeBranch?.id ||
    null
  return { idTenant, idBranch }
})

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <Provider store={store}>
      <>
      <BrowserRouter basename={process.env.PUBLIC_URL}>
        <App />
      </BrowserRouter>
  </>
    </Provider>
);

serviceWorker.unregister()
