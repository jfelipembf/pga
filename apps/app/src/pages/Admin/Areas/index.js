import React, { useEffect, useMemo, useState } from "react"
import { Button, Col, Row } from "reactstrap"
import { connect } from "react-redux"

import BasicTable from "components/Common/BasicTable"
import AreaModal from "./Components/AreaModal"
import { setBreadcrumbItems } from "../../../store/actions"
import { createArea, listAreas } from "../../../services/Areas/index"
import { useToast } from "components/Common/ToastProvider"
import PageLoader from "../../../components/Common/PageLoader"
import { useLoading } from "../../../hooks/useLoading"

const AreasPage = ({ setBreadcrumbItems }) => {
    const [areas, setAreas] = useState([])
    const [modalOpen, setModalOpen] = useState(false)
    const toast = useToast()
    const { isLoading, withLoading } = useLoading()

    useEffect(() => {
        const breadcrumbItems = [
            { title: "Administrativo", link: "/admin" },
            { title: "Áreas", link: "/admin/areas" },
        ]
        setBreadcrumbItems("Áreas", breadcrumbItems)
    }, [setBreadcrumbItems])

    useEffect(() => {
        const load = async () => {
            try {
                await withLoading('page', async () => {
                    const data = await listAreas()
                    setAreas(data)
                })
            } catch (e) {
                console.error(e)
                toast.show({ title: "Erro ao carregar áreas", description: e?.message || String(e), color: "danger" })
            }
        }
        load()
    }, [toast, withLoading])

    const columns = useMemo(
        () => [
            {
                key: "photo",
                label: "Foto",
                render: area =>
                    area.photo ? (
                        <img
                            src={area.photo}
                            alt={area.name}
                            width="48"
                            height="48"
                            className="rounded-circle object-fit-cover"
                        />
                    ) : (
                        <div
                            className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                            style={{ width: 48, height: 48 }}
                        >
                            <i className="mdi mdi-image-off text-muted" />
                        </div>
                    ),
            },
            {
                key: "name",
                label: "Nome",
            },
            {
                key: "width",
                label: "Largura",
                render: area => `${area.width} m`,
            },
            {
                key: "length",
                label: "Comprimento",
                render: area => `${area.length} m`,
            },
            {
                key: "capacity",
                label: "Capacidade",
                render: area => `${area.capacity} pessoas`,
            },
            {
                key: "status",
                label: "Status",
                render: area => (
                    <span
                        className={`badge bg-${area.status === "ativa"
                            ? "success"
                            : area.status === "manutencao"
                                ? "warning"
                                : "secondary"
                            } text-uppercase`}
                    >
                        {area.status}
                    </span>
                ),
            },
            {
                key: "actions",
                label: "Ações",
                render: area => (
                    <Button color="link" className="p-0" onClick={() => alert(`Detalhes de ${area.name}`)}>
                        Ver
                    </Button>
                ),
            },
        ],
        []
    )

    const handleModalSubmit = async data => {
        try {
            await withLoading('submit', async () => {
                const created = await createArea({
                    name: data.name,
                    width: data.width,
                    length: data.length,
                    capacity: data.capacity,
                    photo: data.preview || "https://via.placeholder.com/96x96?text=Area",
                    status: "ativa",
                })
                setAreas(prev => [created, ...prev])
                toast.show({ title: "Área criada", description: data.name, color: "success" })
            })
        } catch (e) {
            console.error(e)
            toast.show({ title: "Erro ao criar área", description: e?.message || String(e), color: "danger" })
        }
    }

    if (isLoading('page') && !areas.length) {
        return <PageLoader />
    }

    return (
        <Row>
            <Col>
                <BasicTable
                    columns={columns}
                    data={areas}
                    searchKeys={["name", "status"]}
                    searchPlaceholder="Buscar áreas..."
                    onNewClick={() => setModalOpen(true)}
                    loading={isLoading('page')}
                />
                <AreaModal
                    isOpen={modalOpen}
                    toggle={() => setModalOpen(false)}
                    onSubmit={handleModalSubmit}
                    submitting={isLoading('submit')}
                />
            </Col>
        </Row>
    )
}

export default connect(null, { setBreadcrumbItems })(AreasPage)
