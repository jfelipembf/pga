import PropTypes from 'prop-types'
import React, { useEffect, useCallback } from "react"

import { connect } from "react-redux"
import { Container } from "reactstrap";
import withRouter from 'components/Common/withRouter';
import {
  changeLayout,
  changeSidebarTheme,
  changeSidebarType,
  changeTopbarTheme,
  changeLayoutWidth,
  changeColor,
  showRightSidebarAction,
  changeMode
} from "../../store/actions"

import { useSelector, useDispatch } from "react-redux";
import { createSelector } from 'reselect';

// Layout Related Components
import Header from "./Header"
import Sidebar from "./Sidebar"
import Rightbar from "../CommonForBoth/Rightbar"
import SubmenuBar from "./SubmenuBar"

import ForcePasswordChangeModal from "../Common/ForcePasswordChangeModal"

// Move selector outside component to preserve memoization
const selectLayoutState = (state) => state.Layout;

const selectLayoutProperties = createSelector(
  selectLayoutState,
  (layout) => ({
    leftSideBarType: layout.leftSideBarType,
  })
);

const Layout = (props) => {

  const dispatch = useDispatch();

  // Pegar dados do usuário do localStorage (padrão do projeto)
  const getUserData = () => {
    try {
      const stored = localStorage.getItem("authUser")
      return stored ? JSON.parse(stored) : null
    } catch (e) {
      return null
    }
  }

  const userData = getUserData()
  const isFirstAccess = userData?.staff?.isFirstAccess === true;

  const {
    leftSideBarType,
  } = useSelector(selectLayoutProperties);

  useEffect(() => {
    const hideRightbar = (event) => {
      var rightbar = document.getElementById("right-bar");
      //if clicked in inside right bar, then do nothing
      if (rightbar && rightbar.contains(event.target)) {
        return;
      } else {
        //if clicked in outside of rightbar then fire action for hide rightbar
        dispatch(showRightSidebarAction(false));
      }
    };

    //init body click event fot toggle rightbar
    document.body.addEventListener("click", hideRightbar, true);

    // Cleanup the event listener on component unmount
    return () => {
      document.body.removeEventListener("click", hideRightbar, true);
    };
  }, [dispatch]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Only initialize layout type once on mount
  useEffect(() => {
    dispatch(changeLayout("vertical"));
  }, [dispatch]);


  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const toggleMenuCallback = useCallback(() => {
    if (leftSideBarType === "default") {
      dispatch(changeSidebarType("condensed", isMobile));
    } else if (leftSideBarType === "condensed") {
      dispatch(changeSidebarType("default", isMobile));
    }
  }, [leftSideBarType, isMobile, dispatch]);


  return (
    <React.Fragment>
      <ForcePasswordChangeModal isOpen={isFirstAccess} />
      {/* <div id="preloader">
        <div id="status">
          <div className="spinner-chase">
            <div className="chase-dot"></div>
            <div className="chase-dot"></div>
            <div className="chase-dot"></div>
            <div className="chase-dot"></div>
            <div className="chase-dot"></div>
            <div className="chase-dot"></div>
          </div>
        </div>
      </div> */}

      {/* // ... (dentro do componente Layout) */}

      <div id="layout-wrapper">
        <Header toggleMenuCallback={toggleMenuCallback} />
        <Sidebar
          theme={props.leftSideBarTheme}
          type={props.leftSideBarType}
          isMobile={props.isMobile}
        />
        <div className="main-content">
          <SubmenuBar />
          <div className="page-content">
            <Container fluid>
              {props.children}
            </Container>
          </div>
        </div>
      </div>
      {props.showRightSidebar ? <Rightbar /> : null}
    </React.Fragment>
  )
}


Layout.propTypes = {
  changeLayoutWidth: PropTypes.func,
  changeColor: PropTypes.func,
  changeMode: PropTypes.func,
  changeSidebarTheme: PropTypes.func,
  changeSidebarType: PropTypes.func,
  changeTopbarTheme: PropTypes.func,
  children: PropTypes.object,
  isPreloader: PropTypes.any,
  layoutWidth: PropTypes.any,
  leftSideBarTheme: PropTypes.any,
  leftSideBarType: PropTypes.any,
  location: PropTypes.object,
  showRightSidebar: PropTypes.any,
  topbarTheme: PropTypes.any
}

const mapStatetoProps = state => {
  // Return explicit properties instead of spread to ensure stable references
  return {
    leftSideBarTheme: state.Layout.leftSideBarTheme,
    leftSideBarType: state.Layout.leftSideBarType,
    layoutWidth: state.Layout.layoutWidth,
    topbarTheme: state.Layout.topbarTheme,
    layoutColor: state.Layout.layoutColor,
    layoutMode: state.Layout.layoutMode,
    isPreloader: state.Layout.isPreloader,
    showRightSidebar: state.Layout.showRightSidebar,
    isMobile: state.Layout.isMobile,
    showSidebar: state.Layout.showSidebar,
    leftMenu: state.Layout.leftMenu,
  }
}

export default connect(mapStatetoProps, {
  changeLayout,
  changeColor,
  changeMode,
  changeSidebarTheme,
  changeSidebarType,
  changeTopbarTheme,
  changeLayoutWidth,
})(withRouter(Layout))
