import React, { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { Container, Row, Col, Card, CardBody, Input, InputGroup } from "reactstrap"
import pgaLogo from "../../assets/images/pgaLogo.png"

import helpContractsGeneral from "../../assets/images/generalContractInfo.png"
import helpContractsEnrollment from "../../assets/images/matriculaImage.png"
import helpContractsValue from "../../assets/images/valueContract.png"

// Content for each topic
const helpContent = {
    "register-student": {
        title: "Configuração Rápida de Alunos",
        description: "Veja como configurar as principais telas de utilização para cadastro de alunos.",
        icon: "mdi-account-plus-outline",
        steps: [
            "Acesse o menu principal e clique em 'Clientes'",
            "No canto superior direito, clique no botão 'Novo Cliente'.",
            "Preencha os dados obrigatórios (Nome, E-mail, Telefone).",
            "Clique em 'Salvar' para finalizar o cadastro.",
        ],
        videoUrl: "https://www.youtube.com/embed/placeholder"
    },
    "contracts": {
        title: "Contratos e Planos",
        description: "Saiba como criar e configurar contratos, definindo valores, duração e regras de suspensão.",
        icon: "mdi-file-document-edit",
        sections: [
            {
                title: "Identificação do Plano",
                image: helpContractsGeneral,
                steps: [
                    "**Contrato Ativo (Canto superior direito)**: Essa caixa de seleção define se o plano está disponível para venda. Se desmarcada, ele fica 'Inativo' e não aparece na lista.",
                    "**Nome Interno**: É o nome que você e sua equipe verão no sistema (ex: 'Anual Comum', como na imagem).",
                    "**Duração**: Define o tempo de vigência do contrato. No exemplo, está '12'.",
                    "**Categoria de Duração**: Define a unidade de tempo da duração. Na imagem, está selecionado 'Meses', significando que o contrato dura 12 meses.",
                    "**Permanência Mínima**: Tempo mínimo (em meses) que o aluno deve ficar no plano. Se colocar '0' (zero), não há fidelidade mínima obrigatória."
                ]
            },
            {
                title: "Matrícula",
                image: helpContractsEnrollment,
                steps: [
                    "**Exigir Matrícula**: Se habilitado, o sistema pedirá para matricular o aluno no momento da venda.",
                    "**Máximo de Matrículas por Semana**: Define quantas vezes por semana o aluno pode agendar aulas. Deixe **0** para ilimitado.",
                    "**Dias Permitidos**: Selecione os dias da semana em que o aluno pode realizar agendamentos. Se nenhum for selecionado, todos os dias ficam liberados."
                ]
            },
            {
                title: "Valores e Suspensão",
                image: helpContractsValue,
                steps: [
                    "**Valor**: Insira o valor total do contrato (ex: 2388).",
                    "**Parcelamento Máximo**: Defina em quantas vezes o aluno pode parcelar esse valor (ex: 12 vezes).",
                    "**Permite Suspender?**: Se marcado como 'Sim', o aluno terá direito a trancar o contrato.",
                    "**Dias Máximos de Suspensão**: O limite total de dias que o contrato pode ficar congelado (ex: 30 dias)."
                ]
            }
        ],
        videoUrl: null
    },
    "create-class": {
        title: "Gestão de Turmas e Grade",
        description: "Aprenda a criar turmas, definir horários e gerenciar a grade de aulas.",
        icon: "mdi-calendar-clock",
        steps: [
            "Acesse o menu 'Administrativos' > 'Turmas'.",
            "Clique em 'Nova Turma'.",
            "Defina a Atividade, Professor, Dias da Semana e Horário.",
            "Salve a turma para que ela apareça na grade."
        ],
        videoUrl: null
    }
}

const HelpPage = () => {
    const { topic, tenant, branch } = useParams()
    const content = helpContent[topic]
    const [searchTerm, setSearchTerm] = useState("")

    const backLink = tenant && branch ? `/${tenant}/${branch}/help` : "/help";

    document.title = "Central de Ajuda | PGA"

    // Custom Hero Style matching the reference with new palette #466a8f
    const heroStyle = {
        backgroundColor: "#466a8f",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%2335506b' fill-opacity='1' d='M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z'%3E%3C/path%3E%3Cpath fill='%235784b3' fill-opacity='0.4' d='M0,160L48,170.7C96,181,192,203,288,197.3C384,192,480,160,576,149.3C672,139,768,149,864,170.7C960,192,1056,224,1152,229.3C1248,235,1344,213,1392,202.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3Cpath fill='%23ffffff' fill-opacity='0.1' d='M0,256L48,245.3C96,235,192,213,288,192C384,171,480,149,576,160C672,171,768,213,864,229.3C960,245,1056,235,1152,202.7C1248,171,1344,117,1392,90.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "80px 0",
        color: "#fff",
        marginBottom: "40px",
        borderRadius: "0.25rem", // Standard bootstrap/dashboard card border radius
        position: "relative",
        overflow: "hidden"
    }

    return (
        <div className="page-content p-0">
            {/* Hero Section */}
            <Container fluid>
                <div style={heroStyle}>
                    {/* Logo positioned top-left */}
                    <img
                        src={pgaLogo}
                        alt="Logo"
                        style={{
                            position: 'absolute',
                            top: '40px',
                            left: '40px',
                            height: '100px', // Increased size (approx 2-3x original 50px depending on aspect ratio, adjusted for visual balance)
                            filter: 'brightness(0) invert(1)',
                            opacity: 0.9
                        }}
                    />

                    <Row className="justify-content-center text-center">
                        <Col md={8}>
                            <h2 className="text-white mb-4 mt-4">Como podemos ajudar?</h2>
                            <p className="text-white-50 mb-5 fs-5">
                                Navegue pelas seções e encontre os artigos sobre suas principais dúvidas de uso.
                            </p>

                            <InputGroup size="lg" className="mb-3 bg-white rounded-pill overflow-hidden border-0 p-1">
                                <span className="input-group-text border-0 bg-transparent ps-3">
                                    <i className="mdi mdi-magnify fs-3 text-muted"></i>
                                </span>
                                <Input
                                    placeholder="Pesquisar artigos..."
                                    className="border-0 shadow-none bg-transparent"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                    </Row>
                </div>
            </Container>

            <Container fluid className="pb-5">
                {content ? (
                    // ... (Topic Detail View - kept similar but cleaned up)
                    <Row className="justify-content-center">
                        <Col md={12}>
                            <Card className="shadow-sm border-0 rounded-3">
                                <CardBody className="p-5">
                                    <div className="d-flex align-items-center mb-4">
                                        <Link to={backLink} className="btn btn-light me-3 rounded-circle" style={{ width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <i className="mdi mdi-arrow-left"></i>
                                        </Link>
                                        <h3 className="m-0">{content.title}</h3>
                                    </div>
                                    <hr className="text-muted opacity-25" />

                                    <div className="mt-5">
                                        {/* Support for multiple sections */}
                                        {content.sections ? (
                                            content.sections.map((section, idx) => (
                                                <div key={idx} className="mb-5 last:mb-0">
                                                    {section.title && <h5 className="mb-3 text-primary">{section.title}</h5>}

                                                    {section.image && (
                                                        <div className="mb-4 text-center">
                                                            <img
                                                                src={section.image}
                                                                alt={section.title || content.title}
                                                                className="img-fluid rounded border shadow-sm"
                                                                style={{ maxHeight: '400px', objectFit: 'contain' }}
                                                            />
                                                        </div>
                                                    )}

                                                    {section.steps && (
                                                        <div className="bg-light p-4 rounded-3">
                                                            <ol className="m-0 ps-3">
                                                                {section.steps.map((step, index) => (
                                                                    <li key={index} className="mb-2 fs-5">
                                                                        {step.split(/(\*\*.*?\*\*)/).map((part, i) =>
                                                                            part.startsWith('**') && part.endsWith('**')
                                                                                ? <strong key={i}>{part.slice(2, -2)}</strong>
                                                                                : part
                                                                        )}
                                                                    </li>
                                                                ))}
                                                            </ol>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            /* Fallback for legacy structure */
                                            <>
                                                {content.image && (
                                                    <div className="mb-4 text-center">
                                                        <img
                                                            src={content.image}
                                                            alt={content.title}
                                                            className="img-fluid rounded border shadow-sm"
                                                            style={{ maxHeight: '400px', objectFit: 'contain' }}
                                                        />
                                                    </div>
                                                )}
                                                <h5 className="mb-3 text-primary">Passo a Passo</h5>
                                                <div className="bg-light p-4 rounded-3">
                                                    <ol className="m-0 ps-3">
                                                        {content.steps.map((step, index) => (
                                                            <li key={index} className="mb-2 fs-5">
                                                                {step.split(/(\*\*.*?\*\*)/).map((part, i) =>
                                                                    part.startsWith('**') && part.endsWith('**')
                                                                        ? <strong key={i}>{part.slice(2, -2)}</strong>
                                                                        : part
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ol>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {content.videoUrl && (
                                        <div className="mt-5">
                                            <h5 className="mb-3 text-primary">Vídeo Tutorial</h5>
                                            <div className="ratio ratio-16x9 rounded-3 overflow-hidden shadow-sm">
                                                <iframe src={content.videoUrl} title={content.title} allowFullScreen></iframe>
                                            </div>
                                        </div>
                                    )}
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                ) : (
                    // Main Topic List
                    <Row className="justify-content-center">
                        <Col md={12}>
                            {Object.entries(helpContent).filter(([_, data]) =>
                                data.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                data.description?.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map(([key, data], index) => (
                                <Card key={key} className="mb-3 border border-light shadow-sm rounded-3 overflow-hidden cursor-pointer hover-shadow transition-all">
                                    <Link to={`../help/${key}`} className="text-decoration-none text-dark">
                                        <CardBody className="p-4">
                                            <div className="d-flex align-items-start">
                                                <div className="flex-shrink-0 me-4">
                                                    <div className="avatar-md bg-light rounded-circle d-flex align-items-center justify-content-center">
                                                        <i className={`mdi ${data.icon} fs-2 text-primary`}></i>
                                                    </div>
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h5 className="fs-4 mb-2">{index + 1}. {data.title}</h5>
                                                    <p className="text-muted mb-2 fs-6">
                                                        {data.description}
                                                    </p>
                                                    <small className="text-primary fw-bold">
                                                        Ver artigo <i className="mdi mdi-arrow-right ms-1"></i>
                                                    </small>
                                                </div>
                                            </div>
                                        </CardBody>
                                    </Link>
                                </Card>
                            ))}
                        </Col>
                    </Row>
                )}
            </Container>
        </div>
    )
}

export default HelpPage
