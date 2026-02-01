import React from "react"
import logoIcon from "../../assets/images/logoIcon.png"
import "./Loader.css"

const OverlayLoader = ({ show, label = null, zIndex = 2 }) => {
    if (!show) return null

    return (
        <div
            className="overlay-loader-wrapper"
            style={{ zIndex }}
        >
            <div className="page-loader-content">
                <img src={logoIcon} alt="PGA" className="loader-logo" style={{ width: 60 }} />
                <div className="loader-spinner">
                    <div className="bounce1"></div>
                    <div className="bounce2"></div>
                    <div className="bounce3"></div>
                </div>
                {label && <div className="text-muted small">{label}</div>}
            </div>
        </div>
    )
}

export default OverlayLoader
