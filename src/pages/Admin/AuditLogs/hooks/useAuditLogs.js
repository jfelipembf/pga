import { useState, useEffect, useCallback } from 'react'
import { AuditService } from '../../../../services/Core/AuditService'
import { useTenant } from '../../../../hooks/useTenant'
import { staffRepository } from '../../../../data/repositories/StaffRepository'
import { useAuth } from '../../../../hooks/useAuth'

export const useAuditLogs = () => {
    const { idTenant, idBranch } = useTenant()
    const { user } = useAuth()
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [staff, setStaff] = useState({})
    const [kpis, setKpis] = useState([])
    const [filters, setFilters] = useState({
        action: 'all',
        entityType: 'all',
        severity: 'all',
        startDate: null,
        endDate: null
    })

    const fetchLogs = useCallback(async () => {
        if (!idTenant || !idBranch) return
        setLoading(true)

        try {
            const data = await AuditService.listLogs(idTenant, idBranch, filters)
            setLogs(data)

            // KPIs para a interface
            const now = new Date();
            const todayLogs = data.filter(l => {
                const logDate = l.timestamp?.toDate ? l.timestamp.toDate() : new Date(l.timestamp);
                return logDate.toDateString() === now.toDateString();
            }).length;

            const criticalActions = data.filter(l =>
                l.severity === 'CRITICAL' ||
                String(l.action).toUpperCase().includes('DELETE') ||
                String(l.action).toUpperCase().includes('ERROR')
            ).length;

            setKpis([
                { title: "Total de Logs", total: data.length, iconClass: "clipboard-list-outline" },
                { title: "Eventos Hoje", total: todayLogs, iconClass: "clock-outline" },
                { title: "Ações Críticas", total: criticalActions, iconClass: "alert-decagram-outline" }
            ]);

            // Carregar nomes e fotos da equipe
            const allStaff = await staffRepository.findAll(idTenant, idBranch)
            const staffMap = {}
            allStaff.forEach(s => {
                staffMap[s.id] = {
                    name: s.name || s.email || null,
                    photo: s.photo || s.photoUrl || null,
                    email: s.email
                }
            })
            setStaff(staffMap)

            // Fallback: Se o usuário atual não estiver na lista de staff
            if (user) {
                if (user.uid && !staffMap[user.uid]) {
                    setStaff(prev => ({
                        ...prev,
                        [user.uid]: {
                            name: user.displayName || (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email) || null,
                            photo: user.photoUrl || user.photo || null,
                            email: user.email
                        }
                    }));
                }
            }
        } catch (error) {
            console.error("Erro ao carregar logs:", error)
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, filters, user])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    return {
        logs,
        loading,
        staff,
        kpis,
        filters,
        setFilters,
        refresh: fetchLogs,
        hasMore: false // Implementar paginação real se necessário no futuro
    }
}
