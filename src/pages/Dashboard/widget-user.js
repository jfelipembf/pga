import React, { Component } from 'react';
import { Card } from "reactstrap";

//Import Images
import felipeImg from "../../assets/images/Felipe.jpeg";

class WidgetUser extends Component {

    render() {
        return (
            <React.Fragment>
                <Card className="widget-user">
                    <div className="widget-user-desc p-4 text-center bg-primary position-relative">
                        <i className="fas fa-quote-left h2 text-white-50"></i>
                        <p className="text-white mb-0">Confira as novidades do app: novos módulos de automação e planejamento de treinos para potencializar os resultados da sua unidade!</p>
                    </div>
                    <div className="p-4">
                        <div className="float-start mt-2 me-3">
                            <img src={felipeImg} alt="" className="rounded-circle avatar-sm" />
                        </div>
                        <h6 className="mb-1 font-size-16 mt-2">Felipe Macedo</h6>
                        <p className="text-muted mb-0">CEO</p>
                    </div>
                </Card>
            </React.Fragment>
        );
    }
}

export default WidgetUser;