import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTenant } from '../../../../hooks/useTenant'
import { StaffService } from '../../../../services/Admin/StaffService'
import { toast } from 'react-toastify'
import { useCurrentUser } from '../../../../hooks/useCurrentUser'

/**
 * Hook para gerenciar a lógica de Colaboradores (Staff)
 */
export const useStaff = () => {
    const { idTenant, idBranch } = useTenant()
    const user = useCurrentUser()

    const [staff, setStaff] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState(null)

    const [filterStatus, setFilterStatus] = useState('all')
    const [filterRole, setFilterRole] = useState('all')
    const [filterArea, setFilterArea] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')

    const loadStaff = useCallback(async () => {
        try {
            setLoading(true)

            const filters = {
                status: filterStatus,
                roleId: filterRole !== 'all' ? filterRole : undefined,
                areaId: filterArea !== 'all' ? filterArea : undefined
            }

            const data = await StaffService.listWithFilters(idTenant, idBranch, filters)
            setStaff(data)
        } catch (error) {
            console.error("Erro ao carregar colaboradores:", error)
            toast.error("Erro ao carregar colaboradores")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, filterStatus, filterRole, filterArea])

    useEffect(() => {
        loadStaff()
    }, [loadStaff])

    const toggleModal = () => {
        setModal(!modal)
        if (modal) setSelectedStaff(null)
    }

    const handleEdit = (item) => {
        setSelectedStaff(item)
        setModal(true)
    }

    const handleSave = async (data) => {
        try {
            if (selectedStaff) {
                await StaffService.updateStaff(idTenant, idBranch, user.uid, selectedStaff.id, {
                    ...data,
                    userName: user.displayName || user.email
                })
                toast.success("Colaborador atualizado com sucesso")
            } else {
                await StaffService.createStaff(idTenant, idBranch, user.uid, {
                    ...data,
                    userName: user.displayName || user.email
                })
                toast.success("Colaborador criado com sucesso")
            }
            toggleModal()
            await loadStaff()
        } catch (error) {
            console.error("Erro ao salvar colaborador:", error)
            toast.error("Erro ao salvar colaborador: " + error.message)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Deseja realmente excluir este colaborador?")) return
        try {
            await StaffService.deleteStaff(idTenant, idBranch, user.uid, id)
            toast.success("Colaborador excluído com sucesso")
            await loadStaff()
        } catch (error) {
            console.error("Erro ao excluir colaborador:", error)
            toast.error(error.message || "Erro ao excluir colaborador")
        }
    }

    const filteredStaff = useMemo(() => {
        return staff.filter(item => {
            if (!searchTerm) return true

            const name = item.name || ''
            const email = item.email || ''
            const phone = item.phone || ''

            return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                phone.toLowerCase().includes(searchTerm.toLowerCase())
        })
    }, [staff, searchTerm])

    return {
        idTenant,
        idBranch,
        loading,
        modal,
        selectedStaff,
        filterStatus,
        setFilterStatus,
        filterRole,
        setFilterRole,
        filterArea,
        setFilterArea,
        searchTerm,
        setSearchTerm,
        filteredStaff,
        staff,
        toggleModal,
        handleEdit,
        handleSave,
        handleDelete,
        refresh: loadStaff
    }
}
