import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTenant } from '../../../../hooks/useTenant'
import { ClassService } from '../../../../services/Admin/ClassService'
import { toast } from 'react-toastify'

/**
 * Hook para gerenciar a lógica de Turmas (Classes)
 */
export const useClasses = () => {
    const { idTenant, idBranch } = useTenant()

    const user = useMemo(() => {
        const authUser = localStorage.getItem("authUser")
        return authUser ? JSON.parse(authUser) : null
    }, [])

    const [classes, setClasses] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(false)
    const [selectedClass, setSelectedClass] = useState(null)

    const [filterStatus, setFilterStatus] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')

    const loadClasses = useCallback(async () => {
        try {
            setLoading(true)

            const filters = {
                status: filterStatus
            }

            const data = await ClassService.listWithFilters(idTenant, idBranch, filters)
            setClasses(data)
        } catch (error) {
            console.error("Erro ao carregar turmas:", error)
            toast.error("Erro ao carregar turmas")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, filterStatus])

    useEffect(() => {
        loadClasses()
    }, [loadClasses])

    const toggleModal = () => {
        setModal(!modal)
        if (modal) setSelectedClass(null)
    }

    const handleEdit = (item) => {
        setSelectedClass(item)
        setModal(true)
    }

    const handleSave = async (data) => {
        try {
            if (selectedClass) {
                await ClassService.updateClass(idTenant, idBranch, user.uid, selectedClass.id, {
                    ...data,
                    userName: user.displayName || user.email
                })
                toast.success("Turma atualizada com sucesso")
            } else {
                await ClassService.createClass(idTenant, idBranch, user.uid, {
                    ...data,
                    userName: user.displayName || user.email
                })
                toast.success("Turma criada com sucesso")
            }
            toggleModal()
            await loadClasses()
        } catch (error) {
            console.error("Erro ao salvar turma:", error)
            toast.error("Erro ao salvar turma: " + error.message)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Deseja realmente excluir esta turma?")) return
        try {
            await ClassService.deleteClass(idTenant, idBranch, user.uid, id)
            toast.success("Turma excluída com sucesso")
            await loadClasses()
        } catch (error) {
            console.error("Erro ao excluir turma:", error)
            toast.error(error.message || "Erro ao excluir turma")
        }
    }

    const filteredClasses = useMemo(() => {
        return classes.filter(item => {
            if (!searchTerm) return true

            const name = item.name || ''
            const description = item.description || ''

            return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                description.toLowerCase().includes(searchTerm.toLowerCase())
        })
    }, [classes, searchTerm])

    return {
        idTenant,
        idBranch,
        loading,
        modal,
        selectedClass,
        filterStatus,
        setFilterStatus,
        searchTerm,
        setSearchTerm,
        filteredClasses,
        classes,
        toggleModal,
        handleEdit,
        handleSave,
        handleDelete,
        refresh: loadClasses
    }
}
