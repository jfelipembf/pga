import { combineReducers } from "redux"

// Front
import Layout from "./layout/reducer"

import Breadcrumb from "./Breadcrumb/reducer";

// Authentication
import Login from "./auth/login/reducer"
import Account from "./auth/register/reducer"
import ForgetPassword from "./auth/forgetpwd/reducer"
import Profile from "./auth/profile/reducer"
// Multitenant Context
import Tenant from "./tenant/reducer";

const rootReducer = combineReducers({
  // public
  Layout,
  //Breadcrumb items
  Breadcrumb,
  Login,
  Account,
  ForgetPassword,
  Profile,
  Tenant,
})

export default rootReducer
