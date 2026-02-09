import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTenant } from '../../../../hooks/useTenant'
import { CatalogService } from '../../../../services/Admin/CatalogService'
import { toast } from 'react-toastify'
import { useAuth } from '../../../../hooks/useAuth'

/**
 * Hook para gerenciar a lógica de Catálogo (Catalog)
 */
export const useCatalog = () => {
    const { idTenant, idBranch } = useTenant()

    const { user } = useAuth()

    const [catalog, setCatalog] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)

    const [filterStatus, setFilterStatus] = useState('all')
    const [filterType, setFilterType] = useState('all')
    const [filterCategory, setFilterCategory] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')

    const loadCatalog = useCallback(async () => {
        try {
            setLoading(true)

            const filters = {
                status: filterStatus,
                type: filterType,
                category: filterCategory
            }

            const data = await CatalogService.listWithFilters(idTenant, idBranch, filters)
            setCatalog(data)
        } catch (error) {
            console.error("Erro ao carregar catálogo:", error)
            toast.error("Erro ao carregar catálogo")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, filterStatus, filterType, filterCategory])

    useEffect(() => {
        loadCatalog()
    }, [loadCatalog])

    const toggleModal = () => {
        setModal(!modal)
        if (modal) setSelectedItem(null)
    }

    const handleEdit = (item) => {
        setSelectedItem(item)
        setModal(true)
    }

    const handleSave = async (data) => {
        try {
            if (selectedItem) {
                await CatalogService.updateCatalogItem(idTenant, idBranch, user.uid, selectedItem.id, {
                    ...data,
                    userName: user.displayName || user.email
                })
                toast.success("Item atualizado com sucesso")
            } else {
                await CatalogService.createCatalogItem(idTenant, idBranch, user.uid, {
                    ...data,
                    userName: user.displayName || user.email
                })
                toast.success("Item criado com sucesso")
            }
            toggleModal()
            await loadCatalog()
        } catch (error) {
            console.error("Erro ao salvar item:", error)
            toast.error("Erro ao salvar item: " + error.message)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Deseja realmente excluir este item?")) return
        try {
            await CatalogService.deleteCatalogItem(idTenant, idBranch, user.uid, id)
            toast.success("Item excluído com sucesso")
            await loadCatalog()
        } catch (error) {
            console.error("Erro ao excluir item:", error)
            toast.error(error.message || "Erro ao excluir item")
        }
    }

    const handleUpdateStock = async (id, quantity, operation = 'set') => {
        try {
            await CatalogService.updateStock(idTenant, idBranch, user.uid, id, quantity, operation)
            toast.success("Estoque atualizado com sucesso")
            await loadCatalog()
        } catch (error) {
            console.error("Erro ao atualizar estoque:", error)
            toast.error(error.message || "Erro ao atualizar estoque")
        }
    }

    const filteredCatalog = useMemo(() => {
        return catalog.filter(item => {
            if (!searchTerm) return true

            const name = item.name || ''
            const description = item.description || ''
            const sku = item.sku || ''
            const barcode = item.barcode || ''

            return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                barcode.toLowerCase().includes(searchTerm.toLowerCase())
        })
    }, [catalog, searchTerm])

    return {
        idTenant,
        idBranch,
        loading,
        modal,
        selectedItem,
        filterStatus,
        setFilterStatus,
        filterType,
        setFilterType,
        filterCategory,
        setFilterCategory,
        searchTerm,
        setSearchTerm,
        filteredCatalog,
        catalog,
        toggleModal,
        handleEdit,
        handleSave,
        handleDelete,
        handleUpdateStock,
        refresh: loadCatalog
    }
}
