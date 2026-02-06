import React, { useEffect, useState, useCallback } from "react"
import { Col, Row, Button } from "reactstrap"
import { connect } from "react-redux"

import BasicTable from "../../../components/Common/BasicTable"
import { setBreadcrumbItems } from "../../../store/actions"
import { useNavigate } from "react-router-dom"
import { useStaff } from "./hooks/useStaff"
import { RoleService } from "../../../services/Admin/RoleService"
import PageLoader from "../../../components/Common/PageLoader"
import StaffAddModal from "./Components/StaffAddModal"

const StaffList = ({ setBreadcrumbItems }) => {
  const navigate = useNavigate()
  const {
    idTenant,
    idBranch,
    staff,
    loading,
    modal,
    toggleModal,
    refresh,
    searchTerm,
    setSearchTerm,
    filteredStaff
  } = useStaff()

  const [roles, setRoles] = useState([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  const loadRoles = useCallback(async () => {
    if (!idTenant || !idBranch) return
    try {
      setLoadingRoles(true)
      const rolesData = await RoleService.listAll(idTenant, idBranch)
      setRoles(rolesData)
    } catch (e) {
      console.error("Erro ao carregar cargos:", e)
    } finally {
      setLoadingRoles(false)
    }
  }, [idTenant, idBranch])

  useEffect(() => {
    loadRoles()
  }, [loadRoles])

  const computeAge = birthDate => {
    if (!birthDate) return ""
    const dt = new Date(birthDate)
    if (Number.isNaN(dt.getTime())) return ""
    const diff = Date.now() - dt.getTime()
    const ageDate = new Date(diff)
    return Math.abs(ageDate.getUTCFullYear() - 1970)
  }

  const columns = [
    {
      key: "avatar",
      label: "Colaborador",
      render: item => (
        <div className="d-flex align-items-center gap-3">
          {item.photo ? (
            <img
              src={item.photo}
              alt={item.name}
              className="rounded-circle"
              style={{ objectFit: "cover", flexShrink: 0 }}
              width="48"
              height="48"
            />
          ) : (
            <div
              className="rounded-circle bg-soft-primary d-flex align-items-center justify-content-center text-primary"
              style={{ width: "48px", height: "48px", flexShrink: 0 }}
            >
              <i className="mdi mdi-account fs-3" />
            </div>
          )}
          <div>
            <div className="fw-semibold">{item.name}</div>
            {item.birthDate ? (
              <div className="text-muted fs-12">{computeAge(item.birthDate)} anos</div>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: "roleName",
      label: "Cargo",
      render: item => item.roleName || "-"
    },
    {
      key: "status",
      label: "Status",
      render: item => {
        const status = item.status || 'active'
        const colors = {
          active: "success",
          suspended: "secondary",
          inactive: "danger",
          deleted: "dark"
        }
        const labels = {
          active: "Ativo",
          suspended: "Suspenso",
          inactive: "Inativo",
          deleted: "Excluído"
        }
        return (
          <span className={`badge bg-${colors[status] || 'secondary'} font-size-12 px-2`}>
            {labels[status] || status}
          </span>
        )
      },
    },
    {
      key: "phone",
      label: "Telefone",
      render: item => item.phone || "-"
    },
    {
      key: "email",
      label: "Email",
    },
    {
      key: "actions",
      label: "Ações",
      render: item => (
        <Button color="link" className="p-0 fw-bold" onClick={() => navigate(`${item.id}`)}>
          Ver Perfil
        </Button>
      ),
    },
  ]

  useEffect(() => {
    const breadcrumbItems = [
      { title: "Administrativo", link: "#" },
      { title: "Colaboradores", link: "/admin/staff" },
    ]
    setBreadcrumbItems("Colaboradores", breadcrumbItems)
  }, [setBreadcrumbItems])

  if (loading && !staff.length) {
    return <PageLoader />
  }

  return (
    <Row>
      <Col>
        <BasicTable
          columns={columns}
          data={filteredStaff}
          searchKeys={["name", "email", "phone", "roleName", "status"]}
          searchPlaceholder="Buscar colaboradores..."
          onNewClick={toggleModal}
          loading={loading}
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
        />
        <StaffAddModal
          isOpen={modal}
          toggle={toggleModal}
          onStaffAdded={refresh}
          roles={roles}
          loadingRoles={loadingRoles}
        />
      </Col>
    </Row>
  )
}

export default connect(null, { setBreadcrumbItems })(StaffList)
