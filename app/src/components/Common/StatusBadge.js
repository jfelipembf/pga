import React from "react"
import { Badge } from "reactstrap"
import { getStatusLabel, getStatusColor } from "../../helpers/status"
import "./StatusBadge.css"

/**
 * Componente Badge genérico para status com tradução automática
 * @param {Object} props - Props do componente
 * @param {string} props.status - Status em qualquer idioma
 * @param {string} props.type - Tipo de status ('contract', 'enrollment', 'client', 'sale')
 * @param {boolean} props.pill - Se deve usar estilo pill (arredondado)
 * @param {string} props.className - Classes CSS adicionais
 * @param {Object} props.style - Estilos inline adicionais
 */
const StatusBadge = ({ 
  status, 
  type = "contract",
  pill = true, 
  className = "", 
  style = {},
  ...props 
}) => {
  if (!status) return null

  const label = getStatusLabel(status, type)
  const color = getStatusColor(status)

  return (
    <Badge 
      color={color} 
      pill={pill}
      className={`status-badge ${className}`}
      style={style}
      {...props}
    >
      {label}
    </Badge>
  )
}

export default StatusBadge
