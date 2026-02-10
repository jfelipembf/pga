
import React from "react";
import { Row, Col, Input, Button } from "reactstrap";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { SWIMMING_STYLES, INTENSITIES, EQUIPMENT, DISTANCE_OPTIONS } from "../constants/trainingConstants";

const WorkoutItem = ({ item, index, onChange, onRemove }) => {
    const handleChange = (field, value) => {
        onChange(index, field, value);
    };

    const distanceOptions = DISTANCE_OPTIONS.map(d => ({ value: d, label: `${d}m` }));

    return (
        <div className="workout-item-row py-2 border-bottom px-2">
            <Row className="align-items-center g-2">
                {/* Reps & Dist - Mobile row 1 */}
                <Col md={1} xs={4}>
                    <label className="d-md-none small text-muted mb-0">Reps</label>
                    <Input
                        type="number"
                        value={item.reps}
                        onChange={(e) => handleChange("reps", parseInt(e.target.value) || 0)}
                        min={1}
                        className="form-control-sm text-center"
                        placeholder="Qtd"
                    />
                </Col>

                <Col md={1} xs={8}>
                    <label className="d-md-none small text-muted mb-0">Distância</label>
                    <CreatableSelect
                        isClearable
                        onChange={(newValue) => handleChange("distance", newValue ? parseInt(newValue.value) : 0)}
                        options={distanceOptions}
                        value={item.distance ? { value: item.distance, label: `${item.distance}m` } : null}
                        placeholder="Dist."
                        classNamePrefix="select"
                        menuPortalTarget={document.body}
                        styles={{
                            control: (base) => ({ ...base, minHeight: '32px', height: '32px' }),
                            menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }}
                    />
                </Col>

                {/* Exercise - Mobile row 2 */}
                <Col md={2} xs={12}>
                    <label className="d-md-none small text-muted mb-0">Exercício</label>
                    <Input
                        type="text"
                        value={item.exercise || ''}
                        onChange={(e) => handleChange("exercise", e.target.value)}
                        className="form-control-sm"
                        placeholder="Ex: Crawl"
                    />
                </Col>

                {/* Style & Intensity - Mobile row 3 */}
                <Col md={2} xs={6}>
                    <label className="d-md-none small text-muted mb-0">Estilo</label>
                    <Select
                        options={SWIMMING_STYLES}
                        value={SWIMMING_STYLES.find((opt) => opt.value === item.style?.value || opt.value === item.style)}
                        onChange={(opt) => handleChange("style", opt)}
                        placeholder="Estilo"
                        classNamePrefix="select"
                        menuPortalTarget={document.body}
                        styles={{
                            control: (base) => ({ ...base, minHeight: '32px', height: '32px' }),
                            menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }}
                    />
                </Col>

                <Col md={2} xs={6}>
                    <label className="d-md-none small text-muted mb-0">Intensidade</label>
                    <Select
                        options={INTENSITIES}
                        value={INTENSITIES.find((opt) => opt.value === item.intensity?.value || opt.value === item.intensity)}
                        onChange={(opt) => handleChange("intensity", opt)}
                        placeholder="Intens."
                        classNamePrefix="select"
                        menuPortalTarget={document.body}
                        styles={{
                            control: (base) => ({ ...base, minHeight: '32px' }),
                            menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }}
                    />
                </Col>

                {/* Material & Interval - Mobile row 4 */}
                <Col md={2} xs={8}>
                    <label className="d-md-none small text-muted mb-0">Material</label>
                    <CreatableSelect
                        isMulti
                        isClearable
                        options={EQUIPMENT}
                        value={item.equipment ? (Array.isArray(item.equipment) ? item.equipment.map(val =>
                            typeof val === 'object' ? val : { value: val, label: val }
                        ) : []) : []}
                        onChange={(newValue) => handleChange("equipment", newValue || [])}
                        placeholder="Material"
                        classNamePrefix="select"
                        menuPortalTarget={document.body}
                        styles={{
                            control: (base) => ({ ...base, minHeight: '32px' }),
                            menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }}
                    />
                </Col>

                <Col md={1} xs={4}>
                    <label className="d-md-none small text-muted mb-0">Int. (s)</label>
                    <Input
                        type="text"
                        placeholder="Seg"
                        value={item.interval}
                        onChange={(e) => handleChange("interval", e.target.value)}
                        className="form-control-sm"
                    />
                </Col>

                {/* Remove - Desktop end / Mobile absolute or row end */}
                <Col md={1} xs={12} className="text-end mt-2 mt-md-0">
                    <Button
                        color="danger"
                        size="sm"
                        outline
                        className="w-100 w-md-auto"
                        onClick={() => onRemove(index)}
                        title="Remover"
                    >
                        <i className="mdi mdi-trash-can-outline me-1 d-md-none"></i>
                        {window.innerWidth < 768 ? "Excluir Série" : <i className="mdi mdi-trash-can-outline"></i>}
                    </Button>
                </Col>
            </Row>

            {/* Description Row (Optional) */}
            <Row className="mt-1">
                <Col md={12}>
                    <Input
                        type="text"
                        className="form-control-sm border-0 bg-light"
                        placeholder="Observações (opcional)..."
                        value={item.observation || ''}
                        onChange={(e) => handleChange("observation", e.target.value)}
                    />
                </Col>
            </Row>
        </div>
    );
};

export default WorkoutItem;
