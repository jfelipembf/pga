import React, { useEffect, useMemo, useState } from "react"
import PropTypes from "prop-types"
import { Badge, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap"
import * as evaluationLevelsService from "../../../services/EvaluationLevels"

const LevelDropdown = ({ clientId, currentLevel, onLevelChange, disabled = false, levels: levelsProp }) => {
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
        const levelsData = await evaluationLevelsService.listEvaluationLevels()
        setLevelsState(levelsData)
      } catch (error) {
        console.error("Erro ao carregar níveis:", error)
      } finally {
        setLoading(false)
      }
    }
    loadLevels()
  }, [levelsProp])

  const currentLevelData = levels.find(level => level.id === currentLevel) || levels[0]

  const toggle = () => setIsOpen(!isOpen)

  const handleLevelSelect = (level) => {
    onLevelChange?.(clientId, level.id)
    setIsOpen(false)
  }

  const getLevelColor = (levelValue) => {
    switch (levelValue) {
      case 0: return "secondary"
      case 1: return "warning"
      case 2: return "info"
      case 3: return "primary"
      case 4: return "success"
      default: return "secondary"
    }
  }

  return (
    <Dropdown isOpen={isOpen} toggle={toggle} direction="down" disabled={disabled || loading}>
      <DropdownToggle
        caret
        color={getLevelColor(currentLevelData?.value)}
        size="sm"
        className="d-flex align-items-center gap-1"
        disabled={disabled || loading}
        style={{ minWidth: "100px" }}
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
