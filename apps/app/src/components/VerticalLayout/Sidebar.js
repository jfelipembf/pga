import PropTypes from "prop-types"
import React from "react"
import { connect } from "react-redux"
import withRouter from "components/Common/withRouter"

//i18n
import { withTranslation } from "react-i18next"
import SidebarContent from "./SidebarContent"

const Sidebar = props => {

  return (
    <React.Fragment>
      <div className="vertical-menu">
        <div className="vertical-menu__scroll">
          {props.type !== "condensed" ? <SidebarContent /> : <SidebarContent />}
        </div>
      </div>
    </React.Fragment>
  );
}

Sidebar.propTypes = {
  type: PropTypes.string,
}

const mapStatetoProps = state => {
  // Sidebar doesn't use layout, so don't subscribe to it
  // This prevents unnecessary re-renders when layout state changes
  return {}
}

// Wrap with React.memo to prevent unnecessary re-renders
const MemoizedSidebar = React.memo(Sidebar, (prevProps, nextProps) => {
  // Custom comparison: only re-render if type actually changed
  return prevProps.type === nextProps.type;
});

export default connect(
  mapStatetoProps,
  {}
)(withRouter(withTranslation()(MemoizedSidebar)))
