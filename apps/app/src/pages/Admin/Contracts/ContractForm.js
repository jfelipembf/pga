import PropTypes from "prop-types"
import React from "react"
import { Card, CardBody, Form } from "reactstrap"

// Preferencial: alias (você já usa "components/..." em outras telas)
import ButtonLoader from "components/Common/ButtonLoader"

import useSyncedFormState from "./Hooks/useSyncedFormState"

import {
  ContractEmptyState,
  ContractEnrollmentSection,
  ContractGeneralSection,
  ContractPricingSection,
  ContractSuspensionSection,
} from "./Components"

const ContractForm = ({ value, onChange, onSave, showSaveButton, saving }) => {
  const { formState, updateField } = useSyncedFormState({ value, onChange })

  if (!formState) return <ContractEmptyState />

  return (
    <Card className="shadow-sm h-100">
      <CardBody className="pt-3">
        <Form className="contract-form">
          <ContractGeneralSection formState={formState} updateField={updateField} />
          <ContractEnrollmentSection formState={formState} updateField={updateField} />
          <ContractPricingSection formState={formState} updateField={updateField} />
          <ContractSuspensionSection formState={formState} updateField={updateField} />

          {showSaveButton && (
            <div className="d-flex justify-content-end mt-4">
              <ButtonLoader
                color="primary"
                size="lg"
                onClick={() => onSave(formState)}
                disabled={!onSave}
                loading={saving}
              >
                Salvar contrato
              </ButtonLoader>
            </div>
          )}
        </Form>
      </CardBody>
    </Card>
  )
}

ContractForm.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func,
  onSave: PropTypes.func,
  showSaveButton: PropTypes.bool,
  saving: PropTypes.bool,
}

export default ContractForm
