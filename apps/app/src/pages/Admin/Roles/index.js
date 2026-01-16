import React, { useEffect, useMemo, useState } from "react"
import { Button, Container } from "reactstrap"
import { connect } from "react-redux"

import PermissionsMatrix from "./Components/PermissionsMatrix"
import RoleModal from "./Components/NewRoleModal"
import { setBreadcrumbItems } from "../../../store/actions"
import { PERMISSIONS, DEFAULT_ROLES, BASE_ROLE_IDS } from "./Constants"
import { ensureDefaultRoles, createRole, deleteRole } from "../../../services/Roles/index"
import { useToast } from "components/Common/ToastProvider"
import PageLoader from "../../../components/Common/PageLoader"
import { useLoading } from "../../../hooks/useLoading"

const RolesPage = ({ setBreadcrumbItems }) => {
  const [roles, setRoles] = useState([])
  const [pendingChanges, setPendingChanges] = useState({}) // { roleId: { ...updatedRole } }
  const [editMode, setEditMode] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState("create") // create | edit
  const [roleBeingEdited, setRoleBeingEdited] = useState(null)
  const toast = useToast()
  const { isLoading, withLoading } = useLoading()

  const permissions = useMemo(() => PERMISSIONS, [])
  const sortedRoles = useMemo(
    () =>
      roles
        .filter(r => r && r.label)
        .slice()
        .sort((a, b) => (a.label || "").localeCompare(b.label || "")),
    [roles]
  )

  useEffect(() => {
    const breadcrumbItems = [
      { title: "Administrativo", link: "/admin" },
      { title: "Cargos e Permissões", link: "/roles" },
    ]
    setBreadcrumbItems("Cargos e Permissões", breadcrumbItems)
  }, [setBreadcrumbItems])

  useEffect(() => {
    const load = async () => {
      try {
        await withLoading('page', async () => {
          const seeded = await ensureDefaultRoles(DEFAULT_ROLES)
          setRoles(seeded)
        })
      } catch (e) {
        console.error(e)
        toast.show({ title: "Erro ao carregar cargos", description: e?.message || String(e), color: "danger" })
      }
    }
    load()
  }, [toast, withLoading])

  const toggleEditMode = () => {
    setEditMode(prev => !prev)
    setSelectedRoles(new Set())
    setRoleBeingEdited(null)
  }

  const handleTogglePermission = (roleId, permissionId) => {
    if (editMode) {
      toast.show({ title: "Dica", description: "Saia do modo de edição de nomes para alterar as permissões.", color: "info" })
      return
    }

    const baseRole = pendingChanges[roleId] || roles.find(r => r.id === roleId);
    if (!baseRole) return;

    const updatedRole = {
      ...baseRole,
      permissions: {
        ...(baseRole.permissions || {}),
        [permissionId]: !baseRole.permissions?.[permissionId],
      },
    };

    // Atualiza estado local de roles para feedback visual imediato
    setRoles(prev => prev.map(role => role.id === roleId ? updatedRole : role));

    // Armazena no buffer de mudanças pendentes
    setPendingChanges(prev => ({
      ...prev,
      [roleId]: updatedRole
    }));
  }

  const handleSaveAllChanges = async () => {
    const changesCount = Object.keys(pendingChanges).length;
    if (changesCount === 0) return;

    try {
      await withLoading('submit', async () => {
        for (const roleId in pendingChanges) {
          await createRole(pendingChanges[roleId]);
        }
        setPendingChanges({});
        toast.show({ title: "Sucesso", description: "Todas as alterações foram salvas!", color: "success" });
      });
    } catch (e) {
      console.error(e);
      toast.show({ title: "Erro", description: "Algumas alterações não puderam ser salvas.", color: "danger" });
    }
  }

  const handleCancelChanges = () => {
    // Recarregar os dados do banco para descartar o estado local sujo
    const load = async () => {
      try {
        await withLoading('page', async () => {
          const seeded = await ensureDefaultRoles(DEFAULT_ROLES)
          setRoles(seeded)
          setPendingChanges({})
        })
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }

  const handleSelectRole = roleId => {
    if (BASE_ROLE_IDS.includes(roleId)) return // Bloqueia seleção de cargos base

    setSelectedRoles(prev => {
      const next = new Set(prev)
      if (next.has(roleId)) next.delete(roleId)
      else next.add(roleId)
      return next
    })
  }

  const handleDeleteSelected = async () => {
    if (selectedRoles.size === 0) return
    const idsToDelete = Array.from(selectedRoles).filter(id => !BASE_ROLE_IDS.includes(id))

    if (idsToDelete.length === 0) {
      toast.show({ title: "Ação bloqueada", description: "Não é possível excluir cargos base.", color: "warning" })
      return
    }

    try {
      await withLoading('submit', async () => {
        for (const id of idsToDelete) {
          await deleteRole(id)
        }
        setRoles(prev => prev.filter(role => !idsToDelete.includes(role.id)))
        setSelectedRoles(new Set())
        setEditMode(false)
        toast.show({ title: "Sucesso", description: "Cargos excluídos com sucesso.", color: "success" })
      })
    } catch (e) {
      console.error(e)
      toast.show({ title: "Erro", description: "Erro ao excluir cargos.", color: "danger" })
    }
  }

  const handleOpenCreateModal = () => {
    setModalMode("create")
    setRoleBeingEdited(null)
    setModalOpen(true)
  }

  const handleOpenEditModal = () => {
    if (selectedRoles.size !== 1) return
    const roleId = Array.from(selectedRoles)[0]
    const role = roles.find(r => r.id === roleId)
    if (!role) return
    setModalMode("edit")
    setRoleBeingEdited(role)
    setModalOpen(true)
  }

  const handleModalSubmit = async data => {
    if (!data) return

    try {
      if (modalMode === "edit" && roleBeingEdited) {
        await withLoading('submit', async () => {
          const updatedRole = {
            ...roleBeingEdited,
            label: data.label,
            description: data.description,
            isInstructor: data.isInstructor,
          }

          await createRole(updatedRole) // createRole acts as upsert

          setRoles(prev =>
            prev.map(role =>
              role.id === roleBeingEdited.id ? updatedRole : role
            )
          )

          toast.show({ title: "Sucesso", description: "Cargo atualizado com sucesso.", color: "success" })
          setModalOpen(false)
          setRoleBeingEdited(null)
          setSelectedRoles(new Set())
          setEditMode(false)
        })
        return
      }

      const newRole = {
        id: data.label.toLowerCase().replace(/\s+/g, "-"),
        label: data.label,
        description: data.description || "Cargo criado manualmente",
        isInstructor: !!data.isInstructor,
        permissions: {},
      }

      await withLoading('submit', async () => {
        const created = await createRole(newRole)
        setRoles(prev => [...prev, created])
        toast.show({ title: "Sucesso", description: "Cargo criado com sucesso.", color: "success" })
        setModalOpen(false)
      })

    } catch (e) {
      console.error(e)
      toast.show({ title: "Erro", description: e?.message || "Erro ao salvar cargo.", color: "danger" })
    }
  }

  const matrixActions = editMode ? (
    <>
      <Button color="danger" size="sm" disabled={selectedRoles.size === 0} onClick={handleDeleteSelected}>
        Excluir selecionados
      </Button>
      <Button
        color="warning"
        size="sm"
        disabled={selectedRoles.size !== 1}
        onClick={handleOpenEditModal}
      >
        Editar selecionado
      </Button>
      <Button color="light" size="sm" onClick={toggleEditMode}>
        Concluir edição
      </Button>
      <Button color="primary" size="sm" onClick={handleOpenCreateModal}>
        Novo cargo
      </Button>
    </>
  ) : (
    <>
      {Object.keys(pendingChanges).length > 0 && (
        <>
          <Button color="success" size="sm" onClick={handleSaveAllChanges} disabled={isLoading('submit')}>
            {isLoading('submit') ? "Salvando..." : "Salvar Alterações"}
          </Button>
          <Button color="light" size="sm" onClick={handleCancelChanges} disabled={isLoading('submit')}>
            Descartar
          </Button>
        </>
      )}
      <Button color="light" size="sm" onClick={toggleEditMode} disabled={Object.keys(pendingChanges).length > 0}>
        Editar cargos
      </Button>
      <Button color="primary" size="sm" onClick={handleOpenCreateModal}>
        Novo cargo
      </Button>
    </>
  )

  if (isLoading('page') && !roles.length) {
    return <PageLoader />
  }

  return (
    <React.Fragment>
      <Container fluid>
        <PermissionsMatrix
          permissions={permissions}
          roles={sortedRoles}
          editMode={editMode}
          selectedRoles={selectedRoles}
          onSelectRole={handleSelectRole}
          onTogglePermission={handleTogglePermission}
          actions={matrixActions}
          loading={isLoading('page')}
        />
      </Container>


      <RoleModal
        isOpen={modalOpen}
        toggle={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialRole={roleBeingEdited}
        mode={modalMode}
        submitting={isLoading('submit')}
      />
    </React.Fragment>
  )
}

export default connect(null, { setBreadcrumbItems })(RolesPage)
