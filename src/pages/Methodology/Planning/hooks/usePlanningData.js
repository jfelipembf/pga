import { useState, useCallback } from 'react';
import { useTenant } from '../../../../hooks/useTenant';
import { AttendanceService } from '../../../../services/Classes/AttendanceService';
import { enrollmentRepository } from '../../../../data/repositories/EnrollmentRepository';
import { toast } from 'react-toastify';

export const usePlanningData = () => {
    const { idTenant, idBranch, isReady } = useTenant();
    const [students, setStudents] = useState([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    const loadSessionStudents = useCallback(async (session) => {
        if (!session?.id || !isReady) return;

        setLoadingStudents(true);
        try {
            // Reutiliza a lógica robusta de buscar alunos da turma + alunos da sessão (experimentais)
            const [classEnrollments, sessionEnrollments] = await Promise.all([
                session.idClass ? AttendanceService.getStudentsForAttendance(idTenant, idBranch, session.idClass, session.sessionDate) : [],
                enrollmentRepository.listSessionEnrolledClients(idTenant, idBranch, session.id)
            ]);

            // Merge simples para visualização (sem lógica de chamada)
            const enrolledMap = new Map();

            // 1. Matrículas da turma
            classEnrollments.forEach(c => enrolledMap.set(String(c.idClient), {
                id: c.idClient,
                name: c.clientName || c.name,
                photo: c.clientPhoto || c.photo,
                tag: 'Matriculado'
            }));

            // 2. Matrículas da sessão (sobrepõe se necessário)
            sessionEnrollments.forEach(c => {
                enrolledMap.set(String(c.idClient), {
                    id: c.idClient,
                    name: c.clientName,
                    photo: c.clientPhoto,
                    tag: c.enrollmentType === 'trial' ? 'Experimental' : 'Sessão'
                });
            });

            setStudents(Array.from(enrolledMap.values()));
        } catch (error) {
            console.error("Erro ao carregar alunos para planejamento:", error);
            toast.error("Erro ao carregar lista de alunos.");
        } finally {
            setLoadingStudents(false);
        }
    }, [idTenant, idBranch, isReady]);

    return {
        students,
        loadingStudents,
        loadSessionStudents
    };
};
