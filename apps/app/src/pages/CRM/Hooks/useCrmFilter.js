import { useMemo } from "react"
import { parseDate } from "../Utils/dateParsers"
import { CRM_CLIENTS } from "../Constants/mockClients"

export const useCrmFilter = (activeSegment, startDate, endDate) => {
    return useMemo(() => {
        const segmentClients = CRM_CLIENTS.filter(client => client.segments.includes(activeSegment))

        if (startDate && endDate) {
            const start = startDate.getTime()
            const end = endDate.getTime()
            return segmentClients.filter(client => {
                const ref = parseDate(client.referenceDate)
                if (!ref) return true
                const ts = ref.getTime()
                return ts >= start && ts <= end
            })
        }

        return segmentClients
    }, [activeSegment, startDate, endDate])
}
