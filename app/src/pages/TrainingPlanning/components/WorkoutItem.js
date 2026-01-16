
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
        <div className="workout-item-row py-2 border-bottom">
            <Row className="align-items-center g-2">
                {/* REPS */}
                <Col md={1} xs={2}>
                    <Input
                        type="number"
                        value={item.reps}
                        onChange={(e) => handleChange("reps", e.target.value)}
                        min={1}
                        className="form-control-sm text-center"
                        placeholder="Qtd"
                    />
                </Col>

                {/* DISTANCE */}
                <Col md={2} xs={3}>
                    <CreatableSelect
                        isClearable
                        onChange={(newValue) => handleChange("distance", newValue ? newValue.value : "")}
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

                {/* STYLE */}
                <Col md={2} xs={7}>
                    <Select
                        options={SWIMMING_STYLES}
                        value={SWIMMING_STYLES.find((opt) => opt.value === item.style?.value || opt.value === item.style)}
                        onChange={(opt) => handleChange("style", opt)} // Save full object
                        placeholder="Estilo"
                        classNamePrefix="select"
                        menuPortalTarget={document.body}
                        styles={{
                            control: (base) => ({ ...base, minHeight: '32px', height: '32px' }),
                            menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }}
                    />
                </Col>

                {/* EQUIPMENT */}
                <Col md={2} xs={6}>
                    <CreatableSelect
                        isMulti
                        isClearable
                        options={EQUIPMENT}
                        value={item.equipment ? (Array.isArray(item.equipment) ? item.equipment.map(val =>
                            typeof val === 'object' ? val : { value: val, label: val }
                        ) : []) : []}
                        onChange={(newValue) => handleChange("equipment", newValue || [])} // Save array of objects
                        placeholder="Material"
                        classNamePrefix="select"
                        menuPortalTarget={document.body}
                        styles={{
                            control: (base) => ({ ...base, minHeight: '32px' }),
                            menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }}
                    />
                </Col>

                {/* INTENSITY */}
                <Col md={2} xs={6}>
                    <Select
                        options={INTENSITIES}
                        value={INTENSITIES.find((opt) => opt.value === item.intensity?.value || opt.value === item.intensity)}
                        onChange={(opt) => handleChange("intensity", opt)} // Save full object
                        placeholder="Intens."
                        classNamePrefix="select"
                        menuPortalTarget={document.body}
                        styles={{
                            control: (base) => ({ ...base, minHeight: '32px', height: '32px' }),
                            menuPortal: (base) => ({ ...base, zIndex: 9999 })
                        }}
                    />
                </Col>

                {/* INTERVAL */}
                <Col md={2} xs={6}>
                    <Input
                        type="text"
                        placeholder="Int."
                        value={item.interval}
                        onChange={(e) => handleChange("interval", e.target.value)}
                        className="form-control-sm"
                    />
                </Col>

                {/* ACTIONS */}
                <Col md={1} xs={12} className="text-end">
                    <Button
                        color="danger"
                        size="sm"
                        onClick={() => onRemove(index)}
                        title="Remover"
                    >
                        <i className="mdi mdi-trash-can-outline"></i>
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
