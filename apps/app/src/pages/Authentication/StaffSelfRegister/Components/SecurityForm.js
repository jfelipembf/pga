import React from "react"
import { Label, Input, FormFeedback } from "reactstrap"

const SecurityForm = ({ validation }) => {
    return (
        <>
            <h5 className="font-size-14 mb-3 mt-4">Segurança</h5>

            <div className="mb-3">
                <Label>Senha</Label>
                <Input
                    name="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.password}
                    invalid={!!(validation.touched.password && validation.errors.password)}
                />
                {validation.touched.password && validation.errors.password && <FormFeedback>{validation.errors.password}</FormFeedback>}
            </div>

            <div className="mb-3">
                <Label>Repita a senha</Label>
                <Input
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirme a senha"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.confirmPassword}
                    invalid={!!(validation.touched.confirmPassword && validation.errors.confirmPassword)}
                />
                {validation.touched.confirmPassword && validation.errors.confirmPassword && <FormFeedback>{validation.errors.confirmPassword}</FormFeedback>}
            </div>
        </>
    )
}

export default SecurityForm
