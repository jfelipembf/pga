import { useState, useEffect } from "react"
import { useTenant } from "../../../hooks/useTenant"
import { ClassService } from "../../../services/Classes/ClassService"
import { ClientService } from "../../../services/Clients/ClientService"

// TODO: Adicionar método listByClass no EnrollmentService, por enquanto usando repository direto ou mock
export const useClassClients = ({ classId, withLoading }) => {
    const { idTenant, idBranch } = useTenant()
    const [clients, setClients] = useState([])

    useEffect(() => {
        if (!classId) {
            setClients([])
            return
        }

        const fetchClients = async () => {
            try {
                // 1. Buscar matriculados e lista de clientes em paralelo
                const [enrollments, clientsList] = await Promise.all([
                    ClassService.getclientsForClass(idTenant, idBranch, classId),
                    ClientService.listClients(idTenant, idBranch)
                ])

                // 2. Enriquecer os matriculados com dados reais do cliente (foto, status, GymID)
                const mapped = (enrollments || []).map(e => {
                    const clientInfo = clientsList.find(cl => cl.id === e.idClient) || {}

                    return {
                        id: e.idClient,
                        idClient: e.idClient,
                        enrollmentId: e.id,
                        name: clientInfo.name || e.clientName || "Aluno",
                        photo: clientInfo.photoUrl || e.clientPhoto || null,
                        friendlyId: clientInfo.friendlyId || clientInfo.idGym || e.friendlyId || e.idGym || "",
                        idGym: clientInfo.friendlyId || clientInfo.idGym || e.friendlyId || e.idGym || "",
                        status: clientInfo.status || clientInfo.lifecycleStatus || "active",
                        tag: (clientInfo.status || clientInfo.lifecycleStatus)?.toUpperCase().substring(0, 2) || "CL",
                        // Map phone fields precisely for automation
                        phone: clientInfo.phone,
                        cellPhone: clientInfo.cellPhone,
                        mobile: clientInfo.mobile,
                        responsavelPhone: clientInfo.responsavelPhone
                    }
                })

                setClients(mapped)
            } catch (error) {
                console.error("Erro ao buscar e enriquecer alunos da turma", error)
                setClients([])
            }
        }

        if (withLoading) {
            withLoading('classClients', fetchClients)
        } else {
            fetchClients()
        }
    }, [classId, idTenant, idBranch, withLoading])

    return { clients }
}
