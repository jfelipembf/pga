import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTenant } from '../../../../hooks/useTenant'
import { EnrollmentService } from '../../../../services/Clients/EnrollmentService'

/**
 * Hook personalizado para gerenciar matrículas de um cliente
 */
export const useClientEnrollments = (clientId = null) => {
    const { id: idFromParams } = useParams()
    const idClient = clientId || idFromParams
    const { idTenant, idBranch } = useTenant()

    const [enrollments, setEnrollments] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    /**
     * Busca as matrículas do cliente
     */
    const fetchEnrollments = async () => {
        if (!idClient || !idTenant || !idBranch) {
            setLoading(false)
            return
        }

        try {
            setLoading(true)
            setError(null)

            const data = await EnrollmentService.listClientEnrollments(idTenant, idBranch, idClient)

            setEnrollments(data)
        } catch (err) {
            console.error('Erro ao buscar matrículas:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    /**
     * Força atualização dos dados
     */
    const refreshData = () => {
        fetchEnrollments()
    }

    // Carrega inicialmente
    useEffect(() => {
        fetchEnrollments()
    }, [idClient, idTenant, idBranch])

    // Separar matrículas ativas e históricas
    const activeEnrollments = enrollments.filter(e => ['active', 'suspended'].includes(e.status))
    const pastEnrollments = enrollments.filter(e => !['active', 'suspended'].includes(e.status))

    return {
        enrollments,
        activeEnrollments,
        pastEnrollments,
        loading,
        error,
        refreshData
    }
}
