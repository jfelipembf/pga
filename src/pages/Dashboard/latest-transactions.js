import React, { Component } from 'react';
import { Table, Card, CardBody, Button } from "reactstrap";
import { Link } from "react-router-dom";

//Import Images
import user2 from "../../assets/images/users/user-2.jpg";
import user3 from "../../assets/images/users/user-3.jpg";
import user4 from "../../assets/images/users/user-4.jpg";
import user5 from "../../assets/images/users/user-5.jpg";
import user6 from "../../assets/images/users/user-6.jpg";

class LatestTransactions extends Component {
    constructor(props) {
        super(props);
        this.state = {
            transactions: [
                { imgUrl: user2, name: "Herbert C. Patton", status: "Confirm", amount: "14,584", date: "5/12/2016", color: "success" },
                { imgUrl: user3, name: "Mathias N. Klausen", status: "Waiting payment", amount: "8,541", date: "10/11/2016", color: "warning" },
                { imgUrl: user4, name: "Nikolaj S. Henriksen	", status: "Confirm", amount: "954", date: "8/11/2016", color: "success" },
                { imgUrl: user5, name: "Lasse C. Overgaard", status: "Payment expired", amount: "44,584", date: "7/11/2016", color: "danger" },
                { imgUrl: user6, name: "Kasper S. Jessen", status: "Confirm", amount: "8,844", date: "1/11/2016", color: "success" },
            ],
        }
    }

    render() {
        const transactions = this.props.transactions || this.state.transactions;
        const title = this.props.title || "Últimas Matrículas";
        const { tenantSlug, branchSlug } = this.props;

        return (
            <React.Fragment>
                <Card className="h-100">
                    <CardBody>
                        <h4 className="card-title mb-4">{title}</h4>
                        <div className="table-responsive" style={{ maxHeight: "380px", overflowY: "auto" }}>
                            <Table className="align-middle table-centered table-vertical table-nowrap">
                                <thead>
                                    <tr>
                                        <th>Aluno</th>
                                        <th>Status</th>
                                        <th>Valor</th>
                                        <th>Data</th>
                                        <th>Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        transactions && transactions.length > 0 ? (
                                            transactions.map((transaction, key) =>
                                                <tr key={key}>
                                                    <td>
                                                        {transaction.imgUrl ? (
                                                            <img src={transaction.imgUrl} alt="user" className="avatar-xs rounded-circle me-2" />
                                                        ) : (
                                                            <div className="avatar-xs d-inline-block me-2">
                                                                <span className="avatar-title rounded-circle bg-light text-primary">
                                                                    {transaction.name ? transaction.name.charAt(0) : "C"}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {transaction.name}
                                                    </td>
                                                    <td><i className={"mdi mdi-checkbox-blank-circle  text-" + (transaction.color || 'success')}></i> {transaction.status}</td>
                                                    <td>
                                                        {transaction.amount}
                                                    </td>
                                                    <td>
                                                        {transaction.date}
                                                    </td>
                                                    <td>
                                                        {transaction.idClient && tenantSlug && branchSlug ? (
                                                            <Link to={`/${tenantSlug}/${branchSlug}/clients/${transaction.idClient}`} className="btn btn-secondary btn-sm waves-effect waves-light">
                                                                Ver
                                                            </Link>
                                                        ) : (
                                                            <Button color="secondary" size="sm" className="waves-effect waves-light" disabled>Ver</Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="text-center p-4 text-muted">
                                                    Nenhuma matrícula encontrada recentemente.
                                                </td>
                                            </tr>
                                        )
                                    }
                                </tbody>
                            </Table>
                        </div>
                    </CardBody>
                </Card>
            </React.Fragment>
        );
    }
}

export default LatestTransactions;