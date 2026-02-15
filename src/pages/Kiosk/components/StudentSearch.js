
import React from 'react';
import { Input } from 'reactstrap';

const StudentSearch = ({ searchTerm, onSelect, results = [], loading = false }) => {
    // Array simulado de resultados, depois será substituído por hook real
    // const { results, searching } = useStudentSearch(searchTerm); 
    // const results = []; // Placeholder

    return (
        <div className="student-search-container w-100 flex-grow-1 d-flex flex-column align-items-center">
            {/* Input Display Only - ReadOnly but visualized as input */}
            <div className="search-display mb-4 w-100 position-relative" style={{ maxWidth: '600px' }}>
                <Input
                    bsSize="lg"
                    className="text-center fw-normal fs-4 py-2 rounded-pill bg-white text-muted shadow-sm border"
                    value={searchTerm}
                    placeholder="Digite o nome do aluno"
                    readOnly
                    style={{ letterSpacing: '0.5px' }}
                />
                {loading && (
                    <div className="position-absolute end-0 top-50 translate-middle-y me-3">
                        <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                    </div>
                )}
            </div>

            {/* Results List */}
            <div className="search-results w-100 flex-grow-1 overflow-auto" style={{ maxWidth: '600px' }}>
                {results.length > 0 ? (
                    <div className="bg-white rounded shadow-sm">
                        {results.map((student, index) => (
                            <div
                                key={student.id}
                                onClick={() => onSelect(student)}
                                className="d-flex align-items-center px-3 py-3 cursor-pointer student-item"
                                style={{ borderBottom: index < results.length - 1 ? '1px solid #f0f0f0' : 'none' }}
                            >
                                {student.photo ? (
                                    <img
                                        src={student.photo}
                                        alt=""
                                        className="rounded-circle me-3 flex-shrink-0"
                                        style={{ width: '44px', height: '44px', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div
                                        className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold me-3 flex-shrink-0"
                                        style={{ width: '44px', height: '44px', fontSize: '1.1rem' }}
                                    >
                                        {student.name.charAt(0)}
                                    </div>
                                )}
                                <span className="fw-semibold text-dark">{student.name}</span>
                            </div>
                        ))}
                    </div>
                ) : searchTerm.length > 0 && !loading ? (
                    <div className="text-center text-muted mt-5">
                        <i className="mdi mdi-account-search-outline display-1 opacity-25"></i>
                        <p className="mt-3 fs-5">Nenhum aluno encontrado.</p>
                    </div>
                ) : (
                    <div className="text-center text-muted mt-5 opacity-25">
                        {!searchTerm && (
                            <>
                                <i className="mdi mdi-gesture-tap display-1"></i>
                                <p className="mt-3">Digite para buscar...</p>
                            </>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .student-item:active {
                    background-color: #f8f9fa !important;
                }
            `}</style>
        </div>
    );
};

export default StudentSearch;
