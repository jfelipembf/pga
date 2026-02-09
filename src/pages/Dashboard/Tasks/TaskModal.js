import React, { useEffect, useState, useMemo } from 'react';
import {
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Form,
    FormGroup,
    Label,
    Input,
    Row,
    Col,
    FormFeedback
} from 'reactstrap';
import { useFormik } from 'formik';
import { TaskSchema } from '../../../data/schemas/Admin/TaskSchema';
import { StaffService } from '../../../services/Admin/StaffService';
import { useTenant } from '../../../hooks/useTenant';
import { TaskService } from '../../../services/Admin/TaskService';
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import { Portuguese } from "flatpickr/dist/l10n/pt";
import { toast } from 'react-toastify';

const TaskModal = ({ isOpen, toggle, task, onSuccess }) => {
    const { idTenant, idBranch } = useTenant();
    const [staffList, setStaffList] = useState([]);
    const [loadingStaff, setLoadingStaff] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadStaff();
        }
    }, [isOpen]);

    const loadStaff = async () => {
        try {
            setLoadingStaff(true);
            const data = await StaffService.listAll(idTenant, idBranch);
            setStaffList(data);
        } catch (error) {
            console.error("Erro ao carregar colaboradores:", error);
        } finally {
            setLoadingStaff(false);
        }
    };

    const initialValues = useMemo(() => ({
        title: task?.title || '',
        description: task?.description || '',
        priority: task?.priority || 'medium',
        status: task?.status || 'pending',
        dueDate: task?.dueDate ? (task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)) : new Date(),
        assignedTo: task?.assignedTo || '',
        isRecurring: task?.isRecurring || false,
        recurrence: task?.recurrence || {
            frequency: 'daily',
            interval: 1,
            daysOfWeek: [],
            dayOfMonth: new Date().getDate(),
            endDate: null
        }
    }), [task]);

    const formik = useFormik({
        initialValues,
        validationSchema: TaskSchema,
        enableReinitialize: true,
        onSubmit: async (values) => {
            try {
                const assignedStaff = staffList.find(s => s.id === values.assignedTo);
                const payload = {
                    ...values,
                    assignedToName: assignedStaff?.name || 'Não atribuído'
                };

                if (task) {
                    // Update - Logic handled by TaskService and Audit
                    await TaskService.update(idTenant, idBranch, task.id, payload, JSON.parse(localStorage.getItem('authUser')));
                    toast.success("Tarefa atualizada!");
                } else {
                    // Create
                    await TaskService.create(idTenant, idBranch, payload, JSON.parse(localStorage.getItem('authUser')));
                    toast.success("Tarefa criada!");
                }
                onSuccess();
                toggle();
            } catch (error) {
                console.error("Erro ao salvar tarefa:", error);
                toast.error("Erro ao salvar tarefa");
            }
        }
    });

    const handleFileUpload = async (e) => {
        if (!task?.id) {
            toast.warning("Salve a tarefa primeiro antes de anexar arquivos.");
            return;
        }

        const file = e.target.files[0];
        if (file) {
            try {
                await TaskService.uploadAttachment(idTenant, idBranch, task.id, file);
                toast.success("Arquivo anexado!");
                onSuccess();
            } catch (error) {
                toast.error("Erro no upload");
            }
        }
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg">
            <ModalHeader toggle={toggle}>
                {task ? 'Editar Tarefa' : 'Nova Tarefa'}
            </ModalHeader>
            <Form onSubmit={formik.handleSubmit}>
                <ModalBody>
                    <Row>
                        <Col md={12}>
                            <FormGroup>
                                <Label>Título</Label>
                                <Input
                                    name="title"
                                    placeholder="Ex: Revisar contratos"
                                    onChange={formik.handleChange}
                                    value={formik.values.title}
                                    invalid={formik.touched.title && !!formik.errors.title}
                                />
                                <FormFeedback>{formik.errors.title}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={12}>
                            <FormGroup>
                                <Label>Descrição</Label>
                                <Input
                                    type="textarea"
                                    name="description"
                                    rows="3"
                                    onChange={formik.handleChange}
                                    value={formik.values.description}
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <FormGroup>
                                <Label>Data de Entrega</Label>
                                <Flatpickr
                                    className="form-control d-block"
                                    placeholder="Selecione a data"
                                    options={{
                                        locale: Portuguese,
                                        dateFormat: "d/m/Y",
                                        altInput: true,
                                        altFormat: "d/m/Y",
                                    }}
                                    value={formik.values.dueDate}
                                    onChange={([date]) => formik.setFieldValue('dueDate', date)}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label>Prioridade</Label>
                                <Input
                                    type="select"
                                    name="priority"
                                    onChange={formik.handleChange}
                                    value={formik.values.priority}
                                >
                                    <option value="low">Baixa</option>
                                    <option value="medium">Média</option>
                                    <option value="high">Alta</option>
                                </Input>
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <FormGroup>
                                <Label>Atribuir para</Label>
                                <Input
                                    type="select"
                                    name="assignedTo"
                                    onChange={formik.handleChange}
                                    value={formik.values.assignedTo}
                                    invalid={formik.touched.assignedTo && !!formik.errors.assignedTo}
                                >
                                    <option value="">Selecione...</option>
                                    {staffList.map(s => (
                                        <option key={s.id} value={s.id}>{s.name || s.email}</option>
                                    ))}
                                </Input>
                                <FormFeedback>{formik.errors.assignedTo}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={12}>
                            <div
                                className={`p-3 rounded border d-flex align-items-center gap-3 mt-2 transition-all ${formik.values.isRecurring ? 'bg-soft-primary border-primary' : 'bg-light border-transparent'}`}
                                onClick={() => formik.setFieldValue("isRecurring", !formik.values.isRecurring)}
                                style={{ cursor: 'pointer', transition: 'all 0.2s', minHeight: '60px' }}
                            >
                                <div className="form-check custom-checkbox mt-1">
                                    <input
                                        id="isRecurring"
                                        type="checkbox"
                                        className="form-check-input mt-0"
                                        checked={!!formik.values.isRecurring}
                                        onChange={() => { }} // Controlado pelo clique na div pai
                                        style={{ cursor: 'pointer', width: '1.25rem', height: '1.25rem' }}
                                    />
                                </div>
                                <div className="flex-grow-1">
                                    <div className="fw-bold text-dark mb-0 font-size-14">Tarefa Recorrente</div>
                                    <small className="text-muted d-block" style={{ lineHeight: '1.1' }}>Ative para que esta tarefa se repita automaticamente.</small>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {formik.values.isRecurring && (
                        <div className="bg-light p-3 rounded mb-3 border">
                            <h6 className="fw-bold mb-3 border-bottom pb-2">Configurações de Recorrência</h6>

                            <Row className="mb-3">
                                <Col md={6}>
                                    <FormGroup>
                                        <Label>Frequência</Label>
                                        <Input
                                            type="select"
                                            name="recurrence.frequency"
                                            value={formik.values.recurrence.frequency}
                                            onChange={formik.handleChange}
                                        >
                                            <option value="daily">Diária</option>
                                            <option value="weekly">Semanal</option>
                                            <option value="monthly">Mensal</option>
                                            <option value="yearly">Anual</option>
                                        </Input>
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label>Repetir a cada</Label>
                                        <div className="d-flex align-items-center">
                                            <Input
                                                type="number"
                                                name="recurrence.interval"
                                                className="me-2"
                                                style={{ width: '80px' }}
                                                value={formik.values.recurrence.interval}
                                                onChange={formik.handleChange}
                                                min="1"
                                            />
                                            <span className="text-muted">
                                                {formik.values.recurrence.frequency === 'daily' && 'dia(s)'}
                                                {formik.values.recurrence.frequency === 'weekly' && 'semana(s)'}
                                                {formik.values.recurrence.frequency === 'monthly' && 'mês(es)'}
                                                {formik.values.recurrence.frequency === 'yearly' && 'ano(s)'}
                                            </span>
                                        </div>
                                    </FormGroup>
                                </Col>
                            </Row>

                            {formik.values.recurrence.frequency === 'weekly' && (
                                <FormGroup className="mb-3">
                                    <Label>Repetir nos dias</Label>
                                    <div className="d-flex gap-2">
                                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => {
                                            const isSelected = formik.values.recurrence.daysOfWeek?.includes(idx);
                                            return (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    className={`btn btn-sm rounded-circle ${isSelected ? 'btn-primary' : 'btn-outline-secondary'}`}
                                                    style={{ width: '32px', height: '32px', padding: '0' }}
                                                    onClick={() => {
                                                        const currentDays = formik.values.recurrence.daysOfWeek || [];
                                                        const newDays = isSelected
                                                            ? currentDays.filter(d => d !== idx)
                                                            : [...currentDays, idx].sort();
                                                        formik.setFieldValue('recurrence.daysOfWeek', newDays);
                                                    }}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </FormGroup>
                            )}

                            {formik.values.recurrence.frequency === 'monthly' && (
                                <Row className="mb-3">
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label>Dia do mês</Label>
                                            <Input
                                                type="number"
                                                name="recurrence.dayOfMonth"
                                                min="1"
                                                max="31"
                                                value={formik.values.recurrence.dayOfMonth}
                                                onChange={formik.handleChange}
                                                style={{ width: '80px' }}
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            )}

                            <Row>
                                <Col md={12}>
                                    <FormGroup className="mb-0">
                                        <Label>Termina em (Opcional)</Label>
                                        <Flatpickr
                                            className="form-control d-block"
                                            placeholder="Para sempre"
                                            options={{
                                                dateFormat: "d/m/Y",
                                                locale: Portuguese
                                            }}
                                            value={formik.values.recurrence.endDate}
                                            onChange={([date]) => formik.setFieldValue('recurrence.endDate', date)}
                                        />
                                    </FormGroup>
                                </Col>
                            </Row>
                        </div>
                    )}

                    {task?.id && (
                        <Row>
                            <Col md={12}>
                                <Label className="fw-bold mt-2">Anexos</Label>
                                <div className="border border-dashed p-3 text-center mb-3">
                                    <Input
                                        type="file"
                                        id="file-upload"
                                        className="d-none"
                                        onChange={handleFileUpload}
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer mb-0">
                                        <i className="mdi mdi-upload display-4 text-muted"></i>
                                        <p className="mb-0">Clique para anexar um documento ou imagem</p>
                                    </label>
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    {task.attachments?.map((att, idx) => (
                                        <div key={idx} className="bg-light p-2 rounded d-flex align-items-center">
                                            <i className="mdi mdi-file-document-outline me-2"></i>
                                            <a href={att.url} target="_blank" rel="noreferrer" className="text-truncate" style={{ maxWidth: '150px' }}>
                                                {att.name}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </Col>
                        </Row>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={toggle}>Cancelar</Button>
                    <Button color="primary" type="submit">Salvar Tarefa</Button>
                </ModalFooter>
            </Form>
        </Modal>
    );
};

export default TaskModal;
