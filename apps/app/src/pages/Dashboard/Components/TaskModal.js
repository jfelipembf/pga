import React, { useState, useEffect, useMemo } from "react"
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Form, FormGroup, Label, Input } from "reactstrap"
import Select from "react-select"
import { listStaff } from "../../../services/Staff/staff.service"
import { createTask } from "../../../services/Tasks/tasks.service"
import { getAuthUser } from "../../../helpers/permission_helper"
import { useToast } from "../../../components/Common/ToastProvider"
import ClientAddSearch from "../../../components/Common/ClientAddSearch"
import { useActiveClientsPool } from "../../../hooks/evaluation/useActiveClientsPool"
import { getTodayISO } from "../../../utils/date"
import { addDays, toISODate, parseDate } from "@pga/shared"

const TaskModal = ({ isOpen, toggle, onTaskCreated }) => {
    const [description, setDescription] = useState("")
    const [dueDate, setDueDate] = useState(getTodayISO()) // YYYY-MM-DD
    const [selectedStaffs, setSelectedStaffs] = useState([])
    const [selectedClient, setSelectedClient] = useState(null)
    const [searchText, setSearchText] = useState("")
    const [staffOptions, setStaffOptions] = useState([])
    const [isSaving, setIsSaving] = useState(false)

    // Recurrence states
    const [recurrenceEnabled, setRecurrenceEnabled] = useState(false)
    const [recurrenceFreq, setRecurrenceFreq] = useState("monthly")
    const [recurrenceStart, setRecurrenceStart] = useState("")
    const [endMode, setEndMode] = useState("occurrences") // 'occurrences', 'date', 'infinite'
    const [endValue, setEndValue] = useState(12)

    const toast = useToast()

    // Load active clients for search
    const { clients: activeClientsPool, isLoading: isLoadingClients } = useActiveClientsPool({ enabled: isOpen })

    const candidates = useMemo(() => {
        const q = (searchText || "").trim().toLowerCase()
        if (!q) return []
        const base = Array.isArray(activeClientsPool) ? activeClientsPool : []
        return base
            .filter(s => {
                const name = (s.name || "").toLowerCase()
                // idGym might be undefined/null
                const idGym = s.idGym ? String(s.idGym).toLowerCase() : ""
                return name.includes(q) || idGym.includes(q)
            })
            .slice(0, 5) // Limit to 5 results
    }, [activeClientsPool, searchText])

    const loadStaff = React.useCallback(async () => {
        try {
            const staffs = await listStaff()
            const options = staffs.map(s => ({
                value: s.id,
                label: s.displayName || s.name || s.fullName || s.email,
                photo: s.photo || s.avatar
            }))
            setStaffOptions(options)

            // Pré-selecionar o usuário logado por padrão
            const user = getAuthUser()
            if (user?.uid) {
                const self = options.find(o => o.value === user.uid)
                if (self && selectedStaffs.length === 0) {
                    setSelectedStaffs([self])
                }
            }
        } catch (error) {
            console.error("Erro ao carregar staffs", error)
        }
    }, [selectedStaffs.length])

    useEffect(() => {
        if (isOpen) {
            loadStaff()
        }
    }, [isOpen, loadStaff])

    // Auto-calculate recurrence start when main date changes
    useEffect(() => {
        if (recurrenceEnabled && dueDate) {
            try {
                const date = parseDate(dueDate)
                if (!date) return

                let nextDate
                if (recurrenceFreq === 'daily') {
                    nextDate = addDays(date, 1)
                } else if (recurrenceFreq === 'yearly') {
                    nextDate = new Date(date.getFullYear() + 1, date.getMonth(), date.getDate())
                } else {
                    // monthly default
                    nextDate = new Date(date.getFullYear(), date.getMonth() + 1, date.getDate())
                }

                setRecurrenceStart(toISODate(nextDate))
            } catch (e) {
                console.log("Error calculating next date", e)
            }
        }
    }, [dueDate, recurrenceFreq, recurrenceEnabled])

    // Custom renderer for Select options
    const formatStaffOption = ({ label, photo }) => (
        <div className="d-flex align-items-center">
            {photo ? (
                <img
                    src={photo}
                    alt=""
                    className="rounded-circle me-2"
                    style={{ width: 24, height: 24, objectFit: "cover" }}
                />
            ) : (
                <div
                    className="rounded-circle bg-soft-primary text-primary d-flex align-items-center justify-content-center me-2"
                    style={{ width: 24, height: 24, fontSize: 10, fontWeight: 600 }}
                >
                    {label.charAt(0).toUpperCase()}
                </div>
            )}
            <span>{label}</span>
        </div>
    )

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!description) return toast.show({ title: "Campo obrigatório", description: "Informe a descrição da tarefa", color: "warning" })

        setIsSaving(true)
        try {
            const user = getAuthUser()

            // Prioritize Student Name if selected, otherwise use Staff Names
            const clientTargetName = selectedClient ? selectedClient.name : null

            await createTask({
                description,
                dueDate,
                assignedStaffIds: selectedStaffs.map(s => s.value),
                assignedStaffNames: selectedStaffs.map(s => s.label).join(", "),
                clientName: clientTargetName, // New field for Audit Log
                clientId: selectedClient?.id, // Optional linkage
                createdBy: user?.uid,
                recurrence: recurrenceEnabled ? {
                    enabled: true,
                    frequency: recurrenceFreq,
                    startDate: recurrenceStart,
                    endMode,
                    endValue: endMode === 'infinite' ? null : endValue
                } : null
            })

            toast.show({ title: "Sucesso", description: "Tarefa criada com sucesso", color: "success" })
            setDescription("")
            setSelectedStaffs([])
            setSelectedClient(null)
            setSearchText("")
            setRecurrenceEnabled(false)
            setEndMode("occurrences")
            setEndValue(12)
            onTaskCreated()
            toggle()
        } catch (error) {
            console.error("Erro ao criar tarefa", error)
            toast.show({ title: "Erro", description: "Falha ao criar tarefa", color: "danger" })
        } finally {
            setIsSaving(false)
        }
    }

    const handleSelectClient = (client) => {
        setSelectedClient(client)
        setSearchText("")
    }

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle}>Criar Nova Tarefa</ModalHeader>
            <Form onSubmit={handleSubmit}>
                <ModalBody>
                    <FormGroup>
                        <Label>Vincular a um Aluno (Opcional)</Label>
                        {!selectedClient ? (
                            <ClientAddSearch
                                value={searchText}
                                onChange={setSearchText}
                                candidates={candidates}
                                onSelect={handleSelectClient}
                                placeholder="Pesquise por nome do aluno..."
                                autoFocus={false}
                                disabled={isLoadingClients}
                                showNoResults={searchText.length > 2 && candidates.length === 0}
                            />
                        ) : (
                            <div className="p-2 bg-light border rounded d-flex justify-content-between align-items-center">
                                <div>
                                    <span className="fw-medium text-primary me-2">
                                        <i className="mdi mdi-account-check me-1"></i>
                                        {selectedClient.name}
                                    </span>
                                    {selectedClient.idGym && <small className="text-muted">ID: {selectedClient.idGym}</small>}
                                </div>
                                <Button
                                    close
                                    size="sm"
                                    onClick={() => setSelectedClient(null)}
                                />
                            </div>
                        )}
                    </FormGroup>

                    <FormGroup>
                        <Label>Descrição da Tarefa</Label>
                        <Input
                            type="textarea"
                            rows="3"
                            placeholder="Ex: Ligar para confirmar experimental..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </FormGroup>

                    {/* Show simple date ONLY if recurrence is OFF */}
                    {!recurrenceEnabled && (
                        <FormGroup>
                            <Label>Data de Entrega</Label>
                            <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                required
                            />
                        </FormGroup>
                    )}

                    <FormGroup switch className="my-3">
                        <Input
                            type="switch"
                            id="recurrenceSwitch"
                            checked={recurrenceEnabled}
                            onClick={() => setRecurrenceEnabled(!recurrenceEnabled)}
                        />
                        <Label check for="recurrenceSwitch" className="mb-0 fw-medium">Repetir esta tarefa?</Label>
                    </FormGroup>

                    {recurrenceEnabled && (
                        <div className="p-3 bg-light border rounded mb-3">
                            {/* Embedded Start Date */}
                            <FormGroup>
                                <Label size="sm">Início da Série (1ª Tarefa)</Label>
                                <Input
                                    type="date"
                                    bsSize="sm"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    required
                                />
                            </FormGroup>

                            <FormGroup>
                                <Label size="sm">Frequência</Label>
                                <Input type="select" bsSize="sm" value={recurrenceFreq} onChange={e => setRecurrenceFreq(e.target.value)}>
                                    <option value="daily">Diariamente</option>
                                    <option value="monthly">Mensalmente</option>
                                    <option value="yearly">Anualmente</option>
                                </Input>
                            </FormGroup>

                            <Label size="sm" className="mb-1">Terminar</Label>
                            <div className="d-grid gap-2">
                                <FormGroup check className="mb-0">
                                    <Label check className="small">
                                        <Input
                                            type="radio"
                                            name="endMode"
                                            checked={endMode === 'infinite'}
                                            onChange={() => setEndMode('infinite')}
                                        />{' '}
                                        Nunca (Recorrência infinita)
                                    </Label>
                                </FormGroup>

                                <FormGroup check className="d-flex align-items-center gap-2 mb-0">
                                    <Label check className="small mb-0 text-nowrap">
                                        <Input
                                            type="radio"
                                            name="endMode"
                                            checked={endMode === 'occurrences'}
                                            onChange={() => { setEndMode('occurrences'); setEndValue(12); }}
                                        />{' '}
                                        Após
                                    </Label>
                                    <Input
                                        type="number"
                                        bsSize="sm"
                                        style={{ width: '60px' }}
                                        min="1"
                                        disabled={endMode !== 'occurrences'}
                                        value={endMode === 'occurrences' ? endValue : 12}
                                        onChange={e => setEndValue(e.target.value)}
                                    />
                                    <span className="small">ocorrências</span>
                                </FormGroup>

                                <FormGroup check className="d-flex align-items-center gap-2 mb-0">
                                    <Label check className="small mb-0 text-nowrap">
                                        <Input
                                            type="radio"
                                            name="endMode"
                                            checked={endMode === 'date'}
                                            onChange={() => { setEndMode('date'); setEndValue(""); }}
                                        />{' '}
                                        Em
                                    </Label>
                                    <Input
                                        type="date"
                                        bsSize="sm"
                                        style={{ width: '130px' }}
                                        disabled={endMode !== 'date'}
                                        value={endMode === 'date' ? endValue : ""}
                                        onChange={e => setEndValue(e.target.value)}
                                    />
                                </FormGroup>
                            </div>
                        </div>
                    )}

                    <FormGroup>
                        <Label>Destinar para</Label>
                        <Select
                            isMulti
                            options={staffOptions}
                            value={selectedStaffs}
                            onChange={setSelectedStaffs}
                            placeholder="Selecione um ou mais colaboradores..."
                            formatOptionLabel={formatStaffOption}
                        />
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={toggle} disabled={isSaving}>Cancelar</Button>
                    <Button color="primary" type="submit" disabled={isSaving}>
                        {isSaving ? "Salvando..." : "Criar Tarefa"}
                    </Button>
                </ModalFooter>
            </Form>
        </Modal>
    )
}

export default TaskModal
