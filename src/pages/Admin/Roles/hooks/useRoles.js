import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTenant } from '../../../../hooks/useTenant'
import { RoleService } from '../../../../services/Admin/RoleService'
import { toast } from 'react-toastify'
import { migrateRoles, getMigrationStats } from '../../../../utils/roleMigration'
import { useCurrentUser } from '../../../../hooks/useCurrentUser'

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export const useRoles = () => {
    const { idTenant, idBranch } = useTenant()
    const user = useCurrentUser()

    const [roles, setRoles] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [lastLoadTime, setLastLoadTime] = useState(null)

    const loadRoles = useCallback(async (force = false) => {
        if (!idTenant || !idBranch) return

        const now = Date.now()
        if (!force && lastLoadTime && (now - lastLoadTime) < CACHE_DURATION) {
            return
        }

        setLoading(true)
        try {
            const data = await RoleService.listWithFilters(idTenant, idBranch, {}, 100)

            // Migra cargos adicionando permissões faltantes
            const migratedRoles = migrateRoles(data)

            // Verifica se houve migração
            const stats = getMigrationStats(data)
            if (stats.rolesNeedingMigration > 0) {

                // Salva cargos migrados automaticamente
                for (const role of migratedRoles) {
                    const original = data.find(r => r.id === role.id)
                    if (original && Object.keys(role.permissions).length > Object.keys(original.permissions || {}).length) {
                        try {
                            await RoleService.updateRole(idTenant, idBranch, user?.uid, role.id, {
                                ...role,
                                userName: user?.displayName || user?.email || 'Sistema'
                            })
                        } catch (error) {
                            console.error(`❌ Erro ao atualizar cargo "${role.name}":`, error)
                        }
                    }
                }

                toast.success(`${stats.rolesNeedingMigration} cargo(s) atualizado(s) com novas permissões`)
            }

            setRoles(migratedRoles)
            setLastLoadTime(now)
        } catch (error) {
            console.error("Erro ao carregar funções:", error)
            toast.error("Erro ao carregar funções")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, user, lastLoadTime])

    useEffect(() => {
        if (idTenant && idBranch) {
            loadRoles()
        }
    }, [idTenant, idBranch, loadRoles])

    const handleSave = async (data) => {
        try {
            setSaving(true)

            if (data.id) {
                await RoleService.updateRole(idTenant, idBranch, user.uid, data.id, {
                    ...data,
                    userName: user.displayName || user.email
                })
                toast.success("Função atualizada com sucesso")
            } else {
                await RoleService.createRole(idTenant, idBranch, user.uid, {
                    ...data,
                    userName: user.displayName || user.email
                })
                toast.success("Função criada com sucesso")
            }

            await loadRoles(true)
            return true
        } catch (error) {
            console.error("Erro ao salvar função:", error)
            toast.error("Erro ao salvar função: " + error.message)
            return false
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (roleOrId) => {
        const id = typeof roleOrId === 'object' ? roleOrId.id : roleOrId


        try {
            setDeleting(true)
            await RoleService.deleteRole(
                idTenant,
                idBranch,
                user.uid,
                id,
                user?.displayName || user?.email || 'Sistema'
            )
            toast.success("Função excluída com sucesso")
            await loadRoles(true)
            return true
        } catch (error) {
            console.error("Erro ao excluir função:", error)
            toast.error(error.message || "Erro ao excluir função")
            return false
        } finally {
            setDeleting(false)
        }
    }

    return {
        filteredRoles: roles,
        loading,
        saving,
        deleting,
        handleSave,
        handleDelete,
        loadRoles
    }
}
