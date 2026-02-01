import React from "react";
import logoIcon from "../../assets/images/logoIcon.png";
import "./Loader.css";

/**
 * Branded Loader for Pages and Components
 * @param {boolean} isFullScreen - If true, occupies the space of the page (localized).
 * @param {boolean} isFixed - If true, covers the entire screen (fixed overlay).
 */
const PageLoader = ({ isFullScreen = true, isFixed = false }) => {
    let wrapperClass = "component-loader-wrapper";

    if (isFixed) {
        wrapperClass = "full-screen-loader";
    } else if (isFullScreen) {
        wrapperClass = "page-loader-wrapper";
    }

    return (
        <div className={wrapperClass}>
            <div className="page-loader-content">
                <img src={logoIcon} alt="PGA" className="loader-logo" />
                <div className="loader-spinner">
                    <div className="bounce1"></div>
                    <div className="bounce2"></div>
                    <div className="bounce3"></div>
                </div>
            </div>
        </div>
    );
};

export default PageLoader;
