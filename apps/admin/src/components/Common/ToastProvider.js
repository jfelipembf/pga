import React, { createContext, useContext, useState, useCallback } from "react"
import { Toast, ToastBody, ToastHeader } from "reactstrap"
import PropTypes from "prop-types"

const ToastContext = createContext(null)

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([])

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, [])

    const addToast = useCallback(({ title, message, color = "primary", duration = 3000 }) => {
        const id = Math.random().toString(36).substr(2, 9)
        setToasts((prev) => [...prev, { id, title, message, color, duration }])

        if (duration) {
            setTimeout(() => {
                removeToast(id)
            }, duration)
        }
    }, [removeToast])

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div
                className="toast-container position-fixed top-0 end-0 p-3"
                style={{ zIndex: 9999, pointerEvents: "none" }}
            >
                <div style={{ pointerEvents: "auto" }}>
                    {toasts.map((toast) => (
                        <Toast key={toast.id} isOpen={true} className={`mb-2 bg-${toast.color} text-white`} transition={{ timeout: 300 }}>
                            <ToastHeader toggle={() => removeToast(toast.id)} className={`text-${toast.color === 'light' ? 'dark' : 'dark'}`}>
                                {toast.title || "Notificação"}
                            </ToastHeader>
                            <ToastBody>{toast.message}</ToastBody>
                        </Toast>
                    ))}
                </div>
            </div>
        </ToastContext.Provider>
    )
}

ToastProvider.propTypes = {
    children: PropTypes.node.isRequired,
}

export const useToast = () => {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return context
}
