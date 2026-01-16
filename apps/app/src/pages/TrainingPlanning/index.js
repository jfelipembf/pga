import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { Row, Col } from "reactstrap";
import { setBreadcrumbItems } from "../../store/actions";
import TrainingCalendar from "./components/TrainingCalendar";
import TrainingDayManager from "./components/TrainingDayManager";

const TrainingPlanning = (props) => {
    const [selectedDate, setSelectedDate] = useState(new Date());

    document.title = "Planejamento de Treinos | Swim Panel";

    const { setBreadcrumbItems } = props;

    useEffect(() => {
        const breadcrumbItems = [{ title: "Gerencial", link: "#" }, { title: "Planejamento de Treinos", link: "#" }];
        setBreadcrumbItems("Planejamento de Treinos", breadcrumbItems);
    }, [setBreadcrumbItems]); // Only re-run if setBreadcrumbItems changes

    return (
        <React.Fragment>
            <Row>
                {/* Left Panel: Calendar */}
                <Col xl={4} lg={5} md={12} className="mb-4">
                    <TrainingCalendar
                        selectedDate={selectedDate}
                        onChange={setSelectedDate}
                    />
                </Col>

                {/* Right Panel: Workout Builder */}
                <Col xl={8} lg={7} md={12}>
                    <TrainingDayManager date={selectedDate} />
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default connect(null, { setBreadcrumbItems })(TrainingPlanning);
