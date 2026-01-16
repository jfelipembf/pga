import React, { Component } from 'react';
import { Card, CardBody } from "reactstrap";
import { Link } from "react-router-dom";

//Import Images
import user1 from "../../assets/images/users/user-1.jpg";
import user2 from "../../assets/images/users/user-2.jpg";
import user3 from "../../assets/images/users/user-3.jpg";
import user4 from "../../assets/images/users/user-4.jpg";
import user5 from "../../assets/images/users/user-5.jpg";
import user6 from "../../assets/images/users/user-6.jpg";

class Inbox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            messages: [
                { imgUrl: user1, title: "Misty", desc: "Oi! Estou disponível...", time: "13:40" },
                { imgUrl: user2, title: "Melissa", desc: "Terminei! Falamos em breve...", time: "13:34" },
                { imgUrl: user3, title: "Dwayne", desc: "Esse tema está ótimo!", time: "13:17" },
                { imgUrl: user4, title: "Martin", desc: "Prazer em te conhecer", time: "12:20" },
                { imgUrl: user5, title: "Vincent", desc: "Oi! Estou disponível...", time: "11:47" },
                { imgUrl: user6, title: "Robert Chappa", desc: "Oi! Estou disponível...", time: "10:12" }
            ],
        }
    }

    render() {
        return (
            <React.Fragment>
                <Card>
                    <CardBody>
                        <h4 className="card-title mb-3">Mensagens</h4>
                        <div className="inbox-wid">
                            {
                                this.state.messages.map((message, key) =>
                                    <Link key={key} to="#" className="text-dark">
                                        <div className="inbox-item">
                                            <div className="inbox-item-img float-start me-3"><img src={message.imgUrl} className="avatar-sm rounded-circle" alt="" /></div>
                                            <h6 className="inbox-item-author mb-1 font-size-16">{message.title}</h6>
                                            <p className="inbox-item-text text-muted mb-0">{message.desc}</p>
                                            <p className="inbox-item-date text-muted">{message.time}</p>
                                        </div>
                                    </Link>
                                )
                            }
                        </div>
                    </CardBody>
                </Card>
            </React.Fragment>
        );
    }
}

export default Inbox;
