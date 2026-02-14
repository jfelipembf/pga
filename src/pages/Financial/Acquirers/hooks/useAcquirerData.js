
import { useState, useEffect, useCallback } from 'react'
import { AcquirerService } from '../../../../services/Financial/AcquirerService'
import { toast } from 'react-toastify'
import { useTenant } from '../../../../hooks/useTenant'
import { ALL_MOCKS } from '../constants/AcquirerMocks'

export const useAcquirerData = () => {
    const { idTenant, idBranch, isReady } = useTenant()
    const [acquirers, setAcquirers] = useState([])
    const [loading, setLoading] = useState(true)

    const loadAcquirers = useCallback(async () => {
        if (!isReady) return;

        try {
            setLoading(true)
            const data = await AcquirerService.listAll(idTenant, idBranch)
            setAcquirers(data)

            // Mock Logic
            let newCreated = false;
            for (const mock of ALL_MOCKS) {
                const exists = data.some(acq => acq.name && acq.name.toUpperCase().includes(mock.name.toUpperCase()));
                if (!exists) {
                    try {
                        console.log(`Adquirente ${mock.name} não encontrada. Criando Mock Automático...`);
                        await AcquirerService.createAcquirer(idTenant, idBranch, "system", mock);
                        newCreated = true;
                    } catch (mockError) {
                        console.error(`Erro ao criar mock ${mock.name}:`, mockError);
                    }
                }
            }
            if (newCreated) {
                const newData = await AcquirerService.listAll(idTenant, idBranch);
                setAcquirers(newData);
                toast.success("Adquirentes padrão (Mocks) criadas automaticamente!");
            }
        } catch (error) {
            console.error("Erro ao carregar adquirentes:", error)
            toast.error("Erro ao carregar adquirentes")
        } finally {
            setLoading(false)
        }
    }, [idTenant, idBranch, isReady])

    useEffect(() => {
        loadAcquirers()
    }, [loadAcquirers])

    return {
        acquirers,
        loading: loading || !isReady,
        refresh: loadAcquirers
    }
}
