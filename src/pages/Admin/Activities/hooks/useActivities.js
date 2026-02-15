import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTenant } from '../../../../hooks/useTenant'
import { ActivityService } from '../../../../services/Admin/ActivityService'
import { AuditService } from '../../../../services/Core/AuditService'
import { toast } from 'react-toastify'
import { useAuth } from '../../../../hooks/useAuth'

/**
 * Hook para gerenciar a lógica de Atividades (Activities)
 * Segue o padrão do Financial/Payables
 */
export const useActivities = () => {
    const { idTenant, idBranch, isReady } = useTenant()

    const { user } = useAuth()

    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [modal, setModal] = useState(false)
    const [selectedActivity, setSelectedActivity] = useState(null)

    const [filterStatus, setFilterStatus] = useState('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [fetchLimit, setFetchLimit] = useState(50)

    // Cache: armazena timestamp da última carga
    const [lastLoadTime, setLastLoadTime] = useState(null)
    const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

    // Reset limit when filters change
    useEffect(() => {
        setFetchLimit(50)
    }, [filterStatus])

    const loadActivities = useCallback(async (forceReload = false) => {
        if (!isReady) return

        // Cache: verifica se precisa recarregar
        const now = Date.now()
        if (!forceReload && lastLoadTime && (now - lastLoadTime) < CACHE_DURATION) {
            return
        }

        try {
            setLoading(true)

            const filters = {
                status: filterStatus
            }

            const data = await ActivityService.listWithFilters(idTenant, idBranch, filters, fetchLimit)
            setActivities(data)
            setLastLoadTime(now) // Atualiza timestamp do cache
        } catch (error) {
            console.error("Erro ao carregar atividades:", error)
            toast.error("Erro ao carregar atividades")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, isReady, filterStatus, fetchLimit, lastLoadTime, CACHE_DURATION])

    useEffect(() => {
        loadActivities()
    }, [loadActivities])

    const toggleModal = () => {
        setModal(!modal)
        if (modal) setSelectedActivity(null)
    }

    const handleEdit = (item) => {
        setSelectedActivity(item)
        setModal(true)
    }

    const handleSave = async (data, objectives = null) => {
        try {
            setSaving(true)
            const activityId = data.id || selectedActivity?.id

            if (activityId) {
                // Update existing activity (basic fields only)
                await ActivityService.updateActivity(idTenant, idBranch, user.uid, activityId, {
                    ...data,
                    userName: user.displayName || user.email
                })

                // Save objectives and topics to subcollections if provided
                if (objectives) {
                    await saveObjectivesAndTopics(activityId, objectives)
                }

                toast.success("Atividade atualizada com sucesso")
            } else {
                // Create new activity
                await ActivityService.createActivity(idTenant, idBranch, user.uid, {
                    ...data,
                    userName: user.displayName || user.email
                })
                toast.success("Atividade criada com sucesso")
            }
            // Não fecha o modal - permite continuar editando
            await loadActivities(true) // Force reload para invalidar cache
            return true
        } catch (error) {
            console.error("Erro ao salvar atividade:", error)
            toast.error("Erro ao salvar atividade: " + error.message)
            return false
        } finally {
            setSaving(false)
        }
    }

    const saveObjectivesAndTopics = async (activityId, objectives) => {
        if (!objectives || typeof objectives !== 'object') return

        // Convert objectives object to array if needed
        const objectivesArray = Array.isArray(objectives) ? objectives : Object.values(objectives)

        // Batch all operations to reduce audit logs
        const operations = []
        let objectivesModified = 0
        let topicsModified = 0

        for (const objective of objectivesArray) {
            if (!objective.id) continue

            // ✅ Se marcado como deleted, fazer soft delete
            if (objective.deleted) {
                operations.push(
                    ActivityService.deleteObjective(
                        idTenant,
                        idBranch,
                        user.uid,
                        activityId,
                        objective.id
                    )
                )
                objectivesModified++
                continue
            }

            // Save or update objective
            const objectiveData = {
                title: objective.title,
                order: objective.order || 0
            }

            operations.push(
                ActivityService.updateObjective(
                    idTenant,
                    idBranch,
                    user.uid,
                    activityId,
                    objective.id,
                    objectiveData
                )
            )
            objectivesModified++

            // Save topics for this objective
            if (objective.topics) {
                const topicsArray = Array.isArray(objective.topics) ? objective.topics : Object.values(objective.topics)

                for (const topic of topicsArray) {
                    if (!topic.id) continue

                    // ✅ Se marcado como deleted, fazer soft delete
                    if (topic.deleted) {
                        operations.push(
                            ActivityService.deleteTopic(
                                idTenant,
                                idBranch,
                                user.uid,
                                activityId,
                                objective.id,
                                topic.id
                            )
                        )
                        topicsModified++
                        continue
                    }

                    const topicData = {
                        description: topic.description,
                        isFundamental: !!topic.isFundamental,
                        order: topic.order || 0
                    }

                    operations.push(
                        ActivityService.updateTopic(
                            idTenant,
                            idBranch,
                            user.uid,
                            activityId,
                            objective.id,
                            topic.id,
                            topicData
                        )
                    )
                    topicsModified++
                }
            }
        }

        // Execute all operations in parallel
        if (operations.length > 0) {
            await Promise.all(operations)

            // Single consolidated audit log
            await AuditService.log({
                idTenant,
                idBranch,
                userId: user.uid,
                userName: user.displayName || user.email,
                action: 'ACTIVITY_OBJECTIVES_UPDATED',
                entityType: 'activity',
                entityId: activityId,
                description: `Objetivos atualizados: ${objectivesModified} objetivos e ${topicsModified} tópicos modificados`
            })
        }
    }

    const handleDelete = async (activityOrId) => {
        const id = typeof activityOrId === 'object' ? activityOrId.id : activityOrId

        try {
            setDeleting(true)
            await ActivityService.deleteActivity(
                idTenant,
                idBranch,
                user.uid,
                id,
                user.displayName || user.email
            )
            toast.success("Atividade excluída com sucesso")
            await loadActivities(true) // Force reload para invalidar cache
            return true
        } catch (error) {
            console.error("Erro ao excluir atividade:", error)
            toast.error(error.message || "Erro ao excluir atividade")
            return false
        } finally {
            setDeleting(false)
        }
    }

    const handleReorder = async (orderedIds) => {
        try {
            await ActivityService.reorderActivities(idTenant, idBranch, user.uid, orderedIds)
            toast.success("Ordem atualizada com sucesso", { autoClose: 2000 })
        } catch (error) {
            console.error("Erro ao reordenar atividades:", error)
            toast.error("Erro ao reordenar atividades")
        }
    }

    const handleLoadMore = useCallback(() => {
        setFetchLimit(prev => prev + 50)
    }, [])

    const filteredActivities = useMemo(() => {
        const filtered = activities.filter(item => {
            if (!searchTerm) return true

            const name = item.name || ''
            const description = item.description || ''

            return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                description.toLowerCase().includes(searchTerm.toLowerCase())
        })

        // Apply limit
        return filtered.slice(0, fetchLimit)
    }, [activities, searchTerm, fetchLimit])

    const hasMore = useMemo(() => {
        const totalFiltered = activities.filter(item => {
            if (!searchTerm) return true
            const name = item.name || ''
            const description = item.description || ''
            return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                description.toLowerCase().includes(searchTerm.toLowerCase())
        }).length
        return totalFiltered > fetchLimit
    }, [activities, searchTerm, fetchLimit])

    return {
        idTenant,
        idBranch,
        loading: loading || !isReady,
        saving,
        deleting,
        modal,
        selectedActivity,
        filterStatus,
        setFilterStatus,
        searchTerm,
        setSearchTerm,
        filteredActivities,
        activities,
        setActivities,
        toggleModal,
        handleEdit,
        handleSave,
        handleDelete,
        handleReorder,
        handleLoadMore,
        hasMore,
        fetchLimit,
        refresh: loadActivities
    }
}
