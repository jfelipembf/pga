import React, { useEffect, useMemo, useState } from "react"
import PropTypes from "prop-types"
import { Badge, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap"
import { useTenant } from "../../../hooks/useTenant"
import { EvaluationLevelService } from "../../../services/Admin/EvaluationLevelService"

const LevelDropdown = ({ clientId, currentLevel, onLevelChange, disabled = false, levels: levelsProp, className, toggleClassName, fullWidth = false }) => {
  const { tenantSlug: idTenant, branchSlug: idBranch } = useTenant()
  const [levelsState, setLevelsState] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const levels = useMemo(() => {
    return Array.isArray(levelsProp) && levelsProp.length ? levelsProp : levelsState
  }, [levelsProp, levelsState])

  useEffect(() => {
    const loadLevels = async () => {
      if (Array.isArray(levelsProp) && levelsProp.length) return

      setLoading(true)
      try {
        const levelsData = await EvaluationLevelService.listAll(idTenant, idBranch)
        setLevelsState(levelsData)
      } catch (error) {
        console.error("Erro ao carregar níveis:", error)
      } finally {
        setLoading(false)
      }
    }
    loadLevels()
  }, [levelsProp, idTenant, idBranch])

  const currentLevelData = levels.find(level => level.id === currentLevel) || levels[0]

  const toggle = () => setIsOpen(!isOpen)

  const handleLevelSelect = (level) => {
    onLevelChange?.(clientId, level.id)
    setIsOpen(false)
  }

  const maxLevelValue = useMemo(() => {
    return levels.reduce((max, l) => Math.max(max, Number(l.value || 0)), 0)
  }, [levels])

  const getLevelColor = (levelValue) => {
    const v = Number(levelValue)
    if (v === 0) return "secondary"
    if (maxLevelValue === 0) return "info"

    const percent = (v / maxLevelValue) * 100
    if (percent >= 90) return "success"
    if (percent >= 60) return "primary"
    if (percent >= 30) return "info"
    if (percent >= 10) return "warning"
    return "secondary"
  }

  return (
    <Dropdown isOpen={isOpen} toggle={toggle} direction="down" disabled={disabled || loading} className={className} style={fullWidth ? { width: '100%' } : {}}>
      <DropdownToggle
        caret
        color={getLevelColor(currentLevelData?.value)}
        className={`d-flex align-items-center justify-content-between gap-2 ${toggleClassName || ''}`}
        disabled={disabled || loading}
        style={{ minWidth: "100px", width: fullWidth ? '100%' : 'auto' }}
      >
        {loading ? (
          <>
            <i className="mdi mdi-loading mdi-spin" />
            <span>Carregando...</span>
          </>
        ) : (
          <>
            <i className="mdi mdi-star" />
            <span>{currentLevelData?.title || "Nível"}</span>
          </>
        )}
      </DropdownToggle>
      <DropdownMenu>
        {levels.map(level => (
          <DropdownItem
            key={level.id}
            onClick={() => handleLevelSelect(level)}
            active={level.id === currentLevel}
          >
            <div className="d-flex align-items-center justify-content-between w-100">
              <span>{level.title}</span>
              <Badge color={getLevelColor(level.value)} pill className="ms-2">
                {level.value}
              </Badge>
            </div>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  )
}

LevelDropdown.propTypes = {
  clientId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  currentLevel: PropTypes.string,
  onLevelChange: PropTypes.func,
  disabled: PropTypes.bool,
  levels: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ),
}

export default LevelDropdown
