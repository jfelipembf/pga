import React, { Component } from 'react';
import { Card, CardBody } from "reactstrap";
import { Link } from "react-router-dom";

class RecentActivity extends Component {

    render() {
        return (
            <React.Fragment>
                <Card>
                    <CardBody>
                        <h4 className="card-title mb-4">Atividades recentes</h4>
                        <ol className="activity-feed mb-0">
                            <li className="feed-item">
                                <div className="feed-item-list">
                                    <span className="date">25 Jun</span>
                                    <span className="activity-text">Respondeu à necessidade “Atividades voluntárias”</span>
                                </div>
                            </li>
                            <li className="feed-item">
                                <div className="feed-item-list">
                                    <span className="date">24 Jun</span>
                                    <span className="activity-text">Adicionou interesse em “Atividades voluntárias”</span>
                                </div>
                            </li>
                            <li className="feed-item">
                                <div className="feed-item-list">
                                    <span className="date">23 Jun</span>
                                    <span className="activity-text">Entrou no grupo “Fórum de gestão”</span>
                                </div>
                            </li>
                            <li className="feed-item">
                                <div className="feed-item-list">
                                    <span className="date">21 Jun</span>
                                    <span className="activity-text">Respondeu à demanda “Oportunidade pontual”</span>
                                </div>
                            </li>
                        </ol>

                        <div className="text-center">
                            <Link to="#" className="btn btn-sm btn-primary">Ver mais</Link>
                        </div>
                    </CardBody>
                </Card>
            </React.Fragment>
        );
    }
}

export default RecentActivity;
