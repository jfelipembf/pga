
import React from "react";
import ReactDatePicker from "react-datepicker";
import { Card, CardBody } from "reactstrap";
import "react-datepicker/dist/react-datepicker.css";
import "../constants/datepicker-custom.css"; // We will create this for custom styling if needed

const TrainingCalendar = ({ selectedDate, onChange }) => {
    return (
        <Card className="h-100 shadow-sm border-0">
            <CardBody className="p-4">
                <div className="mb-4 border-bottom pb-3">
                    <h5 className="card-title text-primary mb-0">
                        <i className="mdi mdi-calendar-month me-2"></i>
                        Selecione a Data
                    </h5>
                </div>
                <div className="d-flex justify-content-center">
                    <ReactDatePicker
                        selected={selectedDate}
                        onChange={onChange}
                        inline
                        locale="pt-BR"
                        calendarClassName="training-calendar"
                    />
                </div>
            </CardBody>
        </Card>
    );

};

export default TrainingCalendar;
