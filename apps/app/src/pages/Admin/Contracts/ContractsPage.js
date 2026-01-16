import React, { useEffect, useMemo, useState } from "react"
import { connect } from "react-redux"
import { Col, Container, Row, Button } from "reactstrap"
import SideMenu from "components/Common/SideMenu"
import ContractForm from "./ContractForm"
import { setBreadcrumbItems } from "../../../store/actions"
import { useToast } from "components/Common/ToastProvider"
import PageLoader from "../../../components/Common/PageLoader"
import { useLoading } from "../../../hooks/useLoading"
import { listContracts, createContract, updateContract } from "../../../services/Contracts"
import { getStatusLabel } from "../../../helpers/status"

const ContractsPage = ({ setBreadcrumbItems }) => {
  const [contracts, setContracts] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const toast = useToast()
  const { isLoading, withLoading } = useLoading()

  const selectedContract = useMemo(() =>
    contracts.find(c => c.id === selectedId) || (selectedId === "new" ? { name: "Novo Contrato" } : null)
    , [contracts, selectedId])

  useEffect(() => {
    const breadcrumbItems = [
      { title: "Administrativo", link: "/admin" },
      { title: "Contratos", link: "/admin/contracts" },
    ]
    setBreadcrumbItems("Contratos", breadcrumbItems)
  }, [setBreadcrumbItems])

  const loadContracts = React.useCallback(async () => {
    try {
      await withLoading("page", async () => {
        const data = await listContracts()
        setContracts(data)
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id)
        }
      })
    } catch (e) {
      console.error(e)
      toast.show({ title: "Erro ao carregar contratos", description: e?.message || String(e), color: "danger" })
    }
  }, [withLoading, toast, selectedId])

  useEffect(() => {
    loadContracts()
  }, [loadContracts])

  const sideMenuItems = useMemo(() => {
    return contracts.map(item => ({
      id: item.id,
      title: item.title || "Sem nome",
      subtitle: item.value
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)
        : "R$ 0,00",
      meta: getStatusLabel(item.status || "active", "contract"),
    }))
  }, [contracts])

  const handleChange = (updated) => {
    if (selectedId === "new") {
      // Para novos, apenas atualizamos o estado local se necessário ou aguardamos o save
    } else {
      setContracts(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))
    }
  }

  const handleSave = async (updated) => {
    try {
      await withLoading("save", async () => {
        if (selectedId === "new") {
          const res = await createContract(updated)
          toast.show({ title: "Contrato criado", color: "success" })
          await loadContracts()
          setSelectedId(res.id)
        } else {
          await updateContract(selectedId, updated)
          toast.show({ title: "Contrato atualizado", color: "success" })
          await loadContracts()
        }
      })
    } catch (e) {
      console.error(e)
      toast.show({ title: "Erro ao salvar contrato", description: e?.message || String(e), color: "danger" })
    }
  }

  const handleNew = () => {
    setSelectedId("new")
  }

  if (isLoading("page") && contracts.length === 0) {
    return <PageLoader />
  }

  return (
    <Container fluid>
      <Row className="g-4">
        <Col lg="4">
          <SideMenu
            title="Contratos"
            description="Gerencie os modelos de contratos."
            items={sideMenuItems}
            selectedId={selectedId}
            onSelect={setSelectedId}
            emptyLabel="Nenhum contrato cadastrado."
            headerActions={
              <Button color="primary" size="sm" onClick={handleNew}>
                Novo Contrato
              </Button>
            }
          />
        </Col>

        <Col lg="8">
          <ContractForm
            value={selectedId === "new" ? {} : selectedContract}
            onChange={handleChange}
            onSave={handleSave}
            showSaveButton={!!selectedId}
            saving={isLoading("save")}
          />
        </Col>
      </Row>
    </Container>
  )
}

export default connect(null, { setBreadcrumbItems })(ContractsPage)
