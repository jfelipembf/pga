import React from "react"
import { Button, ButtonGroup } from "reactstrap"

import { VIEW_OPTIONS } from "../Constants"

const ViewSelector = ({ value, onChange }) => {
  return (
    <ButtonGroup className="flex-nowrap">
      {VIEW_OPTIONS.map(option => (
        <Button
          key={option.id}
          color={value === option.id ? "primary" : "light"}
          onClick={() => onChange(option.id)}
          size="sm"
        >
          {option.label}
        </Button>
      ))}
    </ButtonGroup>
  )
}

export default ViewSelector
