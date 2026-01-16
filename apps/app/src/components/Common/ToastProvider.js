import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Toast, ToastBody, ToastHeader } from "reactstrap"

const ToastContext = createContext({ show: () => {} })

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const remove = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const show = useCallback(
    ({ title = "Aviso", description = "", color = "success", duration = 4000 } = {}) => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, title, description, color }])
      if (duration > 0) {
        setTimeout(() => remove(id), duration)
      }
    },
    [remove]
  )

  const value = useMemo(() => ({ show }), [show])

  useEffect(() => {
    // Remove toasts that get stuck (safety)
    const timer = setInterval(() => {
      const now = Date.now()
      setToasts(prev => prev.filter(t => now - t.id < 10000))
    }, 10000)
    return () => clearInterval(timer)
  }, [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="position-fixed"
        style={{ top: 16, right: 16, zIndex: 1080, minWidth: 300, maxWidth: 400 }}
      >
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            className="mb-3 shadow-lg border-0 overflow-hidden"
            fade
            role="alert"
            transition={{ timeout: 250 }}
          >
            <ToastHeader
              className="d-flex justify-content-between align-items-center text-white"
              style={{
                background:
                  toast.color === "danger"
                    ? "linear-gradient(135deg,#e74c3c,#c0392b)"
                    : toast.color === "warning"
                    ? "linear-gradient(135deg,#f39c12,#d35400)"
                    : toast.color === "info"
                    ? "linear-gradient(135deg,#3498db,#2980b9)"
                    : "linear-gradient(135deg,#2ecc71,#27ae60)",
              }}
              toggle={() => remove(toast.id)}
            >
              <span className="fw-semibold">{toast.title}</span>
            </ToastHeader>
            {toast.description ? (
              <ToastBody className="bg-white text-dark">
                {toast.description}
              </ToastBody>
            ) : null}
          </Toast>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

export default ToastProvider
