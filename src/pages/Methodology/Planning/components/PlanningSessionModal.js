import React, { useEffect, useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Table, Progress, Badge, Button, UncontrolledTooltip, Row, Col, Card, CardBody } from 'reactstrap';
import { useEvaluationAnalysis } from '../hooks/useEvaluationAnalysis';

/**
 * Modal de Planejamento da Sessão
 * Exibe lista de alunos com status de prontidão para troca de nível.
 */
const PlanningSessionModal = ({ isOpen, toggle, session, students = [] }) => {
    const { analysis, objectivesData, evaluationConfig, analyzeStudents, loading } = useEvaluationAnalysis();
    const [selectedStudent, setSelectedStudent] = useState(null);

    useEffect(() => {
        if (isOpen && session?.idActivity && students.length > 0) {
            analyzeStudents(students, session.idActivity);
        }
    }, [isOpen, session, students, analyzeStudents]);



    const getProgressBarColor = (status) => {
        switch (status) {
            case 'ready': return "success";
            case 'warning': return "warning";
            case 'attention': return "danger";
            default: return "secondary";
        }
    };

    const getTopicData = (topic) => {
        if (!selectedStudent) {
            // Média da turma
            return {
                valueLabel: topic.averageValue,
                percentage: topic.percentage,
                color: topic.percentage >= 70 ? 'success' : topic.percentage >= 40 ? 'warning' : 'danger'
            };
        }

        // Dados do aluno selecionado
        const studentData = analysis[selectedStudent.id];
        if (!studentData || !studentData.criteriaMap) {
            return { valueLabel: '-', percentage: 0, color: 'secondary' };
        }

        const criteria = studentData.criteriaMap[topic.id];
        if (!criteria) {
            return { valueLabel: 'Não avaliado', percentage: 0, color: 'secondary' };
        }

        let val = 0;
        let label = 'Não avaliado';

        if (criteria.idLevel && evaluationConfig.levelValueMap[criteria.idLevel] !== undefined) {
            val = evaluationConfig.levelValueMap[criteria.idLevel];
            // Tenta achar o nome do nível se possível, mas aqui só temos o idLevel e o mapa de valores.
            // O ideal seria ter o mapa de nomes também, mas vamos usar o valor por enquanto.
            label = val.toString();
        } else if (criteria.achieved) {
            val = evaluationConfig.maxLevelValue;
            label = 'Concluído';
        }

        const percentage = evaluationConfig.maxLevelValue > 0 ? (val / evaluationConfig.maxLevelValue) * 100 : 0;

        return {
            valueLabel: label,
            percentage: Math.round(percentage),
            color: percentage >= 70 ? 'success' : percentage >= 40 ? 'warning' : 'danger'
        };
    };



    return (
        <Modal isOpen={isOpen} toggle={toggle} size="xl" centered scrollable>
            <ModalHeader toggle={toggle}>
                Planejamento de Aula - {session?.activityName}
                <div className="font-size-14 text-muted font-weight-normal mt-1">
                    {students.length} alunos matriculados nesta turma
                </div>
            </ModalHeader>
            <ModalBody className="bg-light">
                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary m-1" role="status"></div>
                        <p>Analisando progresso dos alunos...</p>
                    </div>
                ) : (
                    <Row>
                        {/* COLUNA ESQUERDA: LISTA DE ALUNOS */}
                        <Col md={8}>
                            <Card className="shadow-sm border-0 h-100">
                                <CardBody className="p-0">
                                    <div className="table-responsive">
                                        <Table className="align-middle table-nowrap table-hover mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Aluno</th>
                                                    <th style={{ width: '30%' }}>Progresso Geral</th>

                                                    <th className="text-end" style={{ width: '80px' }}>Ver</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {students.map(student => {
                                                    const data = analysis[student.id] || { progress: 0, status: 'no_data' };
                                                    const pendencies = data.fundamentalPendencies || [];
                                                    const hasPendencies = pendencies.length > 0;
                                                    const tooltipId = `tooltip-${student.id}`;
                                                    const isSelected = selectedStudent?.id === student.id;

                                                    return (
                                                        <tr key={student.id} className={isSelected ? 'table-active' : ''}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    {student.profilePicture ? (
                                                                        <img src={student.profilePicture} alt="" className="avatar-xs rounded-circle me-2" />
                                                                    ) : (
                                                                        <div className="avatar-xs me-2">
                                                                            <span className="avatar-title rounded-circle bg-light text-primary font-size-12">
                                                                                {student.name?.charAt(0)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <h5 className="font-size-14 mb-0 text-truncate" style={{ maxWidth: '140px' }}>{student.name}</h5>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <span className="me-2 text-muted small">{data.progress}%</span>
                                                                    <div className="w-100">
                                                                        <Progress
                                                                            value={data.progress}
                                                                            color={getProgressBarColor(data.status)}
                                                                            size="sm"
                                                                            style={{ height: '5px' }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="text-end">
                                                                <Button
                                                                    color={isSelected ? "primary" : "light"}
                                                                    size="sm"
                                                                    className="btn-rounded"
                                                                    onClick={() => setSelectedStudent(isSelected ? null : student)}
                                                                    title="Ver Detalhes"
                                                                >
                                                                    <i className={`mdi ${isSelected ? 'mdi-eye-off' : 'mdi-eye'}`}></i>
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {students.length === 0 && (
                                                    <tr>
                                                        <td colSpan="3" className="text-center text-muted py-4">
                                                            Nenhum aluno matriculado nesta sessão.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </Table>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        {/* COLUNA DIREITA: ESTATÍSTICAS DA TURMA */}
                        <Col md={4}>
                            <Card className="shadow-sm border-0 h-100">
                                <CardBody>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="card-title text-primary mb-0">
                                            <i className="mdi mdi-chart-bar me-2"></i>
                                            {selectedStudent ? `${selectedStudent.name}` : 'Média da Turma'}
                                        </h5>
                                        {selectedStudent && (
                                            <Button
                                                color="link"
                                                size="sm"
                                                className="text-muted p-0"
                                                onClick={() => setSelectedStudent(null)}
                                                title="Voltar para Média Geral"
                                            >
                                                <i className="mdi mdi-close font-size-18"></i>
                                            </Button>
                                        )}
                                    </div>
                                    <div className="d-flex flex-column gap-3" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                        {(!objectivesData || objectivesData.length === 0) ? (
                                            <p className="text-muted small text-center my-4">Nenhum objetivo encontrado.</p>
                                        ) : (
                                            objectivesData.map((objective, objIndex) => (
                                                <div key={objective.id}>
                                                    <h6 className="font-size-13 text-dark fw-bold mb-2 border-bottom pb-1">
                                                        {objIndex + 1}. {objective.title}
                                                    </h6>
                                                    <div className="d-flex flex-column gap-2 ms-2">
                                                        {objective.topics.map((topic, topicIndex) => {
                                                            const stats = getTopicData(topic);
                                                            return (
                                                                <div key={topic.id} className="d-flex flex-column mb-1">
                                                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                                                        <span className={`font-size-12 ${topic.isFundamental ? 'text-dark' : 'text-secondary'}`} style={{ fontWeight: 'normal' }}>
                                                                            {objIndex + 1}.{topicIndex + 1} {topic.name}
                                                                            {topic.isFundamental && <Badge color="warning" className="ms-2">Fundamental</Badge>}
                                                                        </span>
                                                                        <Badge color={stats.color} pill className="font-size-10">
                                                                            {stats.valueLabel}
                                                                        </Badge>
                                                                    </div>
                                                                    <Progress
                                                                        value={stats.percentage}
                                                                        color={stats.color}
                                                                        style={{ height: '3px' }}
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                        {objective.topics.length === 0 && (
                                                            <span className="text-muted small font-italic ms-2">Sem tópicos.</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={toggle}>Fechar</Button>
            </ModalFooter>
        </Modal>
    );
};

export default PlanningSessionModal;
