import PropTypes from "prop-types"
import React, { useCallback, useEffect, useRef } from "react"
import SimpleBar from "simplebar-react"
import MetisMenu from "metismenujs"
import withRouter from "components/Common/withRouter"
import { Link } from "react-router-dom"
import { withTranslation } from "react-i18next"

import { useTenant } from "../../hooks/useTenant"
import { useAuth } from "../../hooks/useAuth"

const SidebarContent = props => {
  const ref = useRef()
  const { tenantSlug, branchSlug } = useTenant()
  const { filteredMenu } = useAuth()

  /**
   * Gera o path completo com tenant/branch prefix
   */
  const linkTo = (path) => {
    if (!path || path.startsWith("/#") || path === "#") return path
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `/${tenantSlug}/${branchSlug}${cleanPath}`
  }

  const activateParentDropdown = useCallback((item) => {
    item.classList.add("active")
    const parent = item.parentElement
    const parent2El = parent.childNodes[1]

    if (parent2El && parent2El.id !== "side-menu") {
      parent2El.classList.add("mm-show")
    }

    if (parent) {
      parent.classList.add("mm-active")
      const parent2 = parent.parentElement

      if (parent2) {
        parent2.classList.add("mm-show")
        const parent3 = parent2.parentElement
        if (parent3) {
          parent3.classList.add("mm-active")
          parent3.childNodes[0].classList.add("mm-active")
          const parent4 = parent3.parentElement
          if (parent4) {
            parent4.classList.add("mm-show")
            const parent5 = parent4.parentElement
            if (parent5) {
              parent5.classList.add("mm-show")
              parent5.childNodes[0].classList.add("mm-active")
            }
          }
        }
      }
      scrollElement(item)
      return false
    }
    scrollElement(item)
    return false
  }, [])

  const removeActivation = (items) => {
    for (var i = 0; i < items.length; ++i) {
      var item = items[i]
      const parent = items[i].parentElement

      if (item && item.classList.contains("active")) {
        item.classList.remove("active")
      }
      if (parent) {
        const parent2El =
          parent.childNodes && parent.childNodes.length && parent.childNodes[1]
            ? parent.childNodes[1]
            : null
        if (parent2El && parent2El.id !== "side-menu") {
          parent2El.classList.remove("mm-show")
        }

        parent.classList.remove("mm-active")
        const parent2 = parent.parentElement

        if (parent2) {
          parent2.classList.remove("mm-show")
          const parent3 = parent2.parentElement
          if (parent3) {
            parent3.classList.remove("mm-active")
            parent3.childNodes[0].classList.remove("mm-active")
            const parent4 = parent3.parentElement
            if (parent4) {
              parent4.classList.remove("mm-show")
              const parent5 = parent4.parentElement
              if (parent5) {
                parent5.classList.remove("mm-show")
                parent5.childNodes[0].classList.remove("mm-active")
              }
            }
          }
        }
      }
    }
  }

  const activeMenu = useCallback(() => {
    const pathName = process.env.PUBLIC_URL + props.router.location.pathname
    let matchingMenuItem = null
    const ul = document.getElementById("side-menu")
    const items = ul.getElementsByTagName("a")
    removeActivation(items)

    for (let i = 0; i < items.length; ++i) {
      if (pathName === items[i].pathname) {
        matchingMenuItem = items[i]
        break
      }
    }
    if (matchingMenuItem) {
      activateParentDropdown(matchingMenuItem)
    }
  }, [props.router.location.pathname, activateParentDropdown])

  useEffect(() => {
    ref.current.recalculate()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      new MetisMenu("#side-menu")
    }, 200)
    return () => {
      clearTimeout(timer)
    }
  }, [filteredMenu]) // Re-init when menu changes

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    activeMenu()
  }, [activeMenu])

  function scrollElement(item) {
    if (item) {
      const currentPosition = item.offsetTop
      if (currentPosition > window.innerHeight) {
        ref.current.getScrollElement().scrollTop = currentPosition - 300
      }
    }
  }

  const closeSidebar = () => {
    if (document.body.classList.contains("sidebar-enable")) {
      document.body.classList.remove("sidebar-enable")
    }
  }

  const renderMenuItem = (item, index) => {
    // Header
    if (item.isHeader) {
      return <li key={index} className="menu-title">{props.t(item.label)}</li>
    }

    // Item com Submenu
    if (item.subItems && item.subItems.length > 0) {
      const label = props.t(item.label) || item.label

      return (
        <li key={index}>
          <Link to="/#" className="has-arrow waves-effect">
            <i className={item.icon}></i>
            <span>{label}</span>
          </Link>
          <ul className="sub-menu">
            {item.subItems.map((subItem, subIndex) => (
              <li key={subIndex}>
                <Link to={linkTo(subItem.path)} onClick={closeSidebar} className="d-flex align-items-center justify-content-between">
                  <span>{props.t(subItem.label) || subItem.label}</span>
                  {subItem.badge && (
                    <span className={`badge rounded-pill bg-${subItem.badgeColor || "info"} ms-2`}>
                      {subItem.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </li>
      )
    }

    // Item Simples
    return (
      <li key={index}>
        <Link to={linkTo(item.path)} className="waves-effect d-flex align-items-center" onClick={closeSidebar}>
          <i className={item.icon}></i>
          <span className="flex-grow-1">{props.t(item.label)}</span>
          {item.badge && (
            <span className={`badge rounded-pill bg-${item.badgeColor || "info"} ms-2`}>
              {item.badge}
            </span>
          )}
        </Link>
      </li>
    )
  }

  return (
    <React.Fragment>
      <SimpleBar style={{ maxHeight: "100%" }} ref={ref}>
        <div id="sidebar-menu">
          <ul className="metismenu list-unstyled" id="side-menu">
            {filteredMenu.map((item, index) => renderMenuItem(item, index))}
          </ul>
        </div>
      </SimpleBar>
    </React.Fragment>
  )
}

SidebarContent.propTypes = {
  location: PropTypes.object,
  t: PropTypes.any,
}

export default withRouter(withTranslation()(SidebarContent))
