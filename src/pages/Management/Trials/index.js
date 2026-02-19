import React, { useEffect } from "react"
import { Card, CardBody } from "reactstrap"
import { connect } from "react-redux"
import { setBreadcrumbItems } from "../../../store/actions"
import { useTrialsData } from "./hooks/useTrialsData"
import TrialsKPIs from "./components/TrialsKPIs"
import TrialsFilters from "./components/TrialsFilters"
import TrialsTable from "./components/TrialsTable"

const TrialsPage = ({ setBreadcrumbItems }) => {
    const {
        trials,
        kpis,
        filters,
        updateFilter,
        applyFilters,
        loading,
        activities,
        staff
    } = useTrialsData()

    useEffect(() => {
        const breadcrumbItems = [
            { title: "Gerencial", link: "#" },
            { title: "Aulas Experimentais", link: "/management/trials" }
        ]
        setBreadcrumbItems("Aulas Experimentais", breadcrumbItems)
    }, [setBreadcrumbItems])

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
