import React, { useMemo } from "react";
import { Row, Col, Input, Button } from "reactstrap";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { SWIMMING_STYLES, INTENSITIES, EQUIPMENT, generateDistanceOptions } from "../constants/trainingConstants";

const WorkoutItem = ({ item, index, onChange, onRemove, poolLength }) => {
    const handleChange = (field, value) => {
        onChange(index, field, value);
    };

    const distanceOptions = useMemo(() => {
        return generateDistanceOptions(poolLength).map(d => ({ value: d, label: `${d}m` }));
    }, [poolLength]);

    const intensityOptions = INTENSITIES.map(i => ({
        value: i.value,
        label: i.label,
        color: i.color,
        description: i.description
    }));

    // Estilos compartilhados para os selects de linha
    const selectStyles = {
        control: (base) => ({
            ...base,
            minHeight: '34px',
            border: 'none',
            backgroundColor: '#f8f9fa',
            boxShadow: 'none',
            fontSize: '0.85rem'
        }),
        menuPortal: (base) => ({ ...base, zIndex: 9999 }), // Garante que não corte
        option: (base, { data }) => ({
            ...base,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem'
        }),
        singleValue: (base) => ({
            ...base,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflow: 'visible' // Evita corte do texto
        }),
    };

    const intensitySelectStyles = {
        ...selectStyles,
        option: (base, { data }) => ({
            ...base,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            '&::before': {
                content: '""',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: data.color || '#ccc',
            }
        }),
        singleValue: (base, { data }) => ({
            ...base,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            '&::before': {
                content: '""',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: data.color || '#ccc',
            }
        }),
    };

    const selectedIntensity = intensityOptions.find(opt => opt.value === (item.intensity?.value || item.intensity));
    const zoneInfo = INTENSITIES.find(z => z.value === (item.intensity?.value || item.intensity));
    const currentDist = parseInt(item.distance) || 0;
    const isNonMultiple = poolLength && currentDist > 0 && currentDist % poolLength !== 0;

    return (
        <div className="workout-item-row py-3 pb-4 border-bottom px-3 px-md-4"
            style={{ borderLeft: zoneInfo ? `4px solid ${zoneInfo.color}` : '4px solid #eee' }}>
            <Row className="align-items-center g-2">
                {/* Reps */}
                <Col md={1} xs={3}>
                    <label className="d-md-none small text-muted mb-1 d-block">Qtd</label>
                    <Input
                        type="number"
                        value={item.reps}
                        onChange={(e) => handleChange("reps", parseInt(e.target.value) || 0)}
                        min={1}
                        className="text-center fw-bold border-0 bg-light"
                        style={{ height: '34px', fontSize: '0.875rem' }}
                    />
                </Col>

                {/* Distância */}
                <Col md={1} xs={4}>
                    <label className="d-md-none small text-muted mb-1 d-block">Metragem</label>
                    <CreatableSelect
                        isClearable
                        onChange={(newValue) => handleChange("distance", newValue ? parseInt(newValue.value) : 0)}
                        options={distanceOptions}
                        value={item.distance ? { value: item.distance, label: `${item.distance}m` } : null}
                        placeholder="Dist."
                        classNamePrefix="select"
                        menuPortalTarget={document.body}
                        styles={{
                            ...selectStyles,
                            control: (base) => ({
                                ...base,
                                ...selectStyles.control(base),
                                backgroundColor: isNonMultiple ? '#fff3cd' : '#f8f9fa'
                            }),
                        }}
                    />
                </Col>

                {/* Exercício */}
                <Col md={2} xs={5}>
                    <label className="d-md-none small text-muted mb-1 d-block">Exercício</label>
                    <Input
                        type="text"
                        value={item.exercise || ''}
                        onChange={(e) => handleChange("exercise", e.target.value)}
                        className="border-0 bg-light"
                        placeholder="Ex: Crawl"
                        style={{ height: '34px', fontSize: '0.875rem' }}
                    />
                </Col>

                {/* Estilo - Mobile: Ganha linha própria se necessário */}
                <Col md={1} xs={6}>
                    <label className="d-md-none small text-muted mb-1 d-block">Estilo</label>
                    <Select
                        options={SWIMMING_STYLES}
                        value={SWIMMING_STYLES.find((opt) => opt.value === item.style?.value || opt.value === item.style)}
                        onChange={(opt) => handleChange("style", opt)}
                        placeholder="Est."
                        classNamePrefix="select"
                        menuPortalTarget={document.body}
                        styles={selectStyles}
                    />
                </Col>

                {/* Intensidade */}
                <Col md={2} xs={6}>
                    <label className="d-md-none small text-muted mb-1 d-block">Zona</label>
                    <Select
                        options={intensityOptions}
                        value={selectedIntensity}
                        onChange={(opt) => handleChange("intensity", opt)}
                        placeholder="Zona"
                        classNamePrefix="select"
                        menuPortalTarget={document.body}
                        styles={intensitySelectStyles}
                    />
                </Col>

                {/* Material */}
                <Col md={2} xs={8}>
                    <label className="d-md-none small text-muted mb-1 d-block">Material</label>
                    <CreatableSelect
                        isMulti
                        isClearable
                        options={EQUIPMENT}
                        value={item.equipment ? (Array.isArray(item.equipment) ? item.equipment.map(val =>
                            typeof val === 'object' ? val : { value: val, label: val }
                        ) : []) : []}
                        onChange={(newValue) => handleChange("equipment", newValue || [])}
                        placeholder="Materiais..."
                        classNamePrefix="select"
                        menuPortalTarget={document.body}
                        styles={selectStyles}
                    />
                </Col>

                {/* Intervalo */}
                <Col md={1} xs={4}>
                    <label className="d-md-none small text-muted mb-1 d-block">Int. (s)</label>
                    <Input
                        type="text"
                        placeholder="Seg"
                        value={item.interval}
                        onChange={(e) => handleChange("interval", e.target.value)}
                        className="text-center border-0 bg-light"
                        style={{ height: '34px', fontSize: '0.875rem' }}
                    />
                </Col>

                {/* Ações */}
                <Col md={1} xs={12} className="text-end pt-md-0 pt-2">
                    <div className="d-flex justify-content-end align-items-center gap-2">
                        {isNonMultiple && (
                            <i className="mdi mdi-alert-circle text-warning fs-5" title="Distância não é múltiplo da piscina"></i>
                        )}
                        <Button
                            color="link"
                            size="sm"
                            className="p-1 px-2 text-danger border"
                            style={{ borderRadius: '4px' }}
                            onClick={() => onRemove(index)}
                        >
                            <i className="mdi mdi-delete-outline fs-5 d-none d-md-block"></i>
                            <span className="d-md-none small fw-bold">Remover Série</span>
                        </Button>
                    </div>
                </Col>
            </Row>

            {/* Obs Opcional */}
            <Row className="mt-2 mx-0">
                <Col md={12} className="ps-0">
                    <Input
                        type="text"
                        className="bg-transparent border-0 font-size-12 text-muted px-0"
                        placeholder="+ Adicionar observação..."
                        value={item.observation || ''}
                        onChange={(e) => handleChange("observation", e.target.value)}
                        style={{ boxShadow: 'none' }}
                    />
                </Col>
            </Row>
        </div>
    );
};

export default WorkoutItem;
