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
import Select from 'react-select';
import { TaskSchema } from '../../../data/schemas/Admin/TaskSchema';
import { StaffService } from '../../../services/Admin/StaffService';
import { ClientService } from '../../../services/Clients/ClientService';
import { useTenant } from '../../../hooks/useTenant';
import { TaskService } from '../../../services/Admin/TaskService';
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import { Portuguese } from "flatpickr/dist/l10n/pt";
import { toast } from 'react-toastify';

const CATEGORIES = [
    { value: 'sales', label: 'Vendas', color: '#34c38f' },
    { value: 'support', label: 'Suporte', color: '#50a5f1' },
    { value: 'admin', label: 'Administrativo', color: '#74788d' },
    { value: 'meeting', label: 'Reunião', color: '#f1b44c' },
    { value: 'other', label: 'Outro', color: '#f46a6a' }
];

const TaskModal = ({ isOpen, toggle, task, onSuccess }) => {
    const { idTenant, idBranch } = useTenant();
    const [staffList, setStaffList] = useState([]);
    const [clientList, setClientList] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadInitialData();
        }
    }, [isOpen]);

    const loadInitialData = async () => {
        try {
            setLoadingData(true);
            const [staff, clients] = await Promise.all([
                StaffService.listAll(idTenant, idBranch),
                ClientService.listClients(idTenant, idBranch)
            ]);
            setStaffList(staff);
            setClientList(clients);
        } catch (error) {
            console.error("Erro ao carregar dados do modal de tarefas:", error);
        } finally {
            setLoadingData(false);
        }
    };

    const initialValues = useMemo(() => ({
        title: task?.title || '',
        description: task?.description || '',
        priority: task?.priority || 'medium',
        status: task?.status || 'pending',
        category: task?.category || 'other',
        estimatedTime: task?.estimatedTime || '',
        dueDate: task?.dueDate ? (task.dueDate.toDate ? task.dueDate.toDate() : new Date(task.dueDate)) : new Date(),
        assignedTo: task?.assignedTo || [],
        relatedStudents: task?.relatedStudents || [],
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
                const payload = { ...values };

                if (task) {
                    await TaskService.update(idTenant, idBranch, task.id, payload, JSON.parse(localStorage.getItem('authUser')));
                    toast.success("Tarefa atualizada!");
                } else {
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

    // Options mapping
    const staffOptions = staffList.map(s => ({ value: s.id, label: s.name, photo: s.photo }));
    const clientOptions = clientList.map(c => ({ value: c.id, label: c.name, photo: c.photoUrl }));

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
                                    placeholder="Detalhes sobre a tarefa..."
                                    onChange={formik.handleChange}
                                    value={formik.values.description}
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Categoria</Label>
                                <Select
                                    options={CATEGORIES}
                                    classNamePrefix="select2-selection"
                                    value={CATEGORIES.find(c => c.value === formik.values.category)}
                                    onChange={(option) => formik.setFieldValue('category', option.value)}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
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
                        <Col md={4}>
                            <FormGroup>
                                <Label>Tempo Estimado (min)</Label>
                                <Input
                                    type="number"
                                    name="estimatedTime"
                                    placeholder="Ex: 30"
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    value={formik.values.estimatedTime}
                                    invalid={formik.touched.estimatedTime && !!formik.errors.estimatedTime}
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={12}>
                            <FormGroup>
                                <Label>Responsáveis (Equipe/Professores)</Label>
                                <Select
                                    isMulti
                                    options={staffOptions}
                                    classNamePrefix="select2-selection"
                                    value={staffOptions.filter(o => formik.values.assignedTo.includes(o.value))}
                                    onChange={(options) => formik.setFieldValue('assignedTo', options.map(o => o.value))}
                                    placeholder="Selecione um ou mais responsáveis..."
                                    isLoading={loadingData}
                                />
                                {formik.touched.assignedTo && formik.errors.assignedTo && (
                                    <div className="text-danger small mt-1">{formik.errors.assignedTo}</div>
                                )}
                            </FormGroup>
                        </Col>
                        <Col md={12}>
                            <FormGroup>
                                <Label>Alunos Relacionados</Label>
                                <Select
                                    isMulti
                                    options={clientOptions}
                                    classNamePrefix="select2-selection"
                                    value={clientOptions.filter(o => formik.values.relatedStudents.includes(o.value))}
                                    onChange={(options) => formik.setFieldValue('relatedStudents', options.map(o => o.value))}
                                    placeholder="Selecione um ou mais alunos..."
                                    isLoading={loadingData}
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
                                        onChange={() => { }}
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
                        <div className="bg-light p-3 rounded mb-3 border mt-3">
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
                        </div>
                    )}

                    {task?.id && (
                        <Row className="mt-3">
                            <Col md={12}>
                                <Label className="fw-bold">Anexos</Label>
                                <div className="border border-dashed p-3 text-center mb-3 rounded">
                                    <Input
                                        type="file"
                                        id="file-upload"
                                        className="d-none"
                                        onChange={handleFileUpload}
                                    />
                                    <label htmlFor="file-upload" className="cursor-pointer mb-0">
                                        <i className="mdi mdi-upload display-4 text-muted"></i>
                                        <p className="mb-0">Clique para anexar arquivos</p>
                                    </label>
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    {task.attachments?.map((att, idx) => (
                                        <div key={idx} className="bg-light p-2 rounded d-flex align-items-center border">
                                            <i className="mdi mdi-file-document-outline me-2 text-primary"></i>
                                            <a href={att.url} target="_blank" rel="noreferrer" className="text-truncate text-dark font-size-12" style={{ maxWidth: '150px' }}>
                                                {att.name}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </Col>
                        </Row>
                    )}
                </ModalBody>
                <ModalFooter className="bg-light">
                    <Button color="link" className="text-muted" onClick={toggle}>Cancelar</Button>
                    <Button color="primary" type="submit" className="px-4">
                        {task ? 'Atualizar Tarefa' : 'Criar Tarefa'}
                    </Button>
                </ModalFooter>
            </Form>
        </Modal>
    );
};

export default TaskModal;
