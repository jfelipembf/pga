import React, { useState, useEffect } from "react"
import { Card, CardBody } from "reactstrap"
import { connect } from "react-redux"
import { setBreadcrumbItems } from "../../../store/actions"
import { useTrialsData } from "./hooks/useTrialsData"
import TrialsKPIs from "./components/TrialsKPIs"
import TrialsFilters from "./components/TrialsFilters"
import TrialsTable from "./components/TrialsTable"
import { ActivityService } from "../../../services/Admin/ActivityService"
import { StaffService } from "../../../services/Admin/StaffService"
import { useTenant } from "../../../hooks/useTenant"

const TrialsPage = ({ setBreadcrumbItems }) => {
    const { idTenant, idBranch, isReady } = useTenant()
    const { trials, kpis, filters, updateFilter, applyFilters, loading } = useTrialsData()

    const [activities, setActivities] = useState([])
    const [staff, setStaff] = useState([])

    useEffect(() => {
        const breadcrumbItems = [
            { title: "Gerencial", link: "#" },
            { title: "Aulas Experimentais", link: "/management/trials" }
        ]
        setBreadcrumbItems("Aulas Experimentais", breadcrumbItems)
    }, [setBreadcrumbItems])

    useEffect(() => {
        const loadOptions = async () => {
            if (!isReady) return
            try {
                const [acts, stf] = await Promise.all([
                    ActivityService.listAll(idTenant, idBranch),
                    StaffService.listAll(idTenant, idBranch)
                ])
                setActivities(acts)
                setStaff(stf)
            } catch (e) {
                console.error("Erro ao carregar opções de filtro:", e)
            }
        }
        loadOptions()
    }, [idTenant, idBranch, isReady])

    return (
        <React.Fragment>
            <TrialsKPIs kpis={kpis} />

            <Card>
                <CardBody>
                    <TrialsFilters
                        filters={filters}
                        onFilterChange={updateFilter}
                        onApply={applyFilters}
                        activities={activities}
                        staff={staff}
                    />

                    <TrialsTable trials={trials} loading={loading} />
                </CardBody>
            </Card>
        </React.Fragment>
    )
}

export default connect(null, { setBreadcrumbItems })(TrialsPage)
