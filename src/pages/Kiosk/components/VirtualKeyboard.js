import React, { useState } from 'react';
import { Container, Button } from 'reactstrap';

const VirtualKeyboard = ({ onKeyPress }) => {
    const [isOpen, setIsOpen] = useState(true);

    const rows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];

    const handleKeyClick = (key) => {
        if (onKeyPress) onKeyPress(key);
    };

    return (
        <div className={`virtual-keyboard shadow-lg backdrop-blur bg-white transition-all`}
            style={{
                transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
                transition: 'transform 0.3s ease-in-out',
                position: 'relative'
            }}>

            {/* Toggle Button - Centered Tab Style */}
            <div className="position-absolute start-50" style={{ top: 0, transform: 'translate(-50%, -100%)', zIndex: 10 }}>
                <Button
                    color="white"
                    className="rounded-top shadow-sm d-flex align-items-center justify-content-center border-0 text-primary"
                    style={{ width: '60px', height: '30px', backgroundColor: '#fff', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <i className={`mdi ${isOpen ? 'mdi-chevron-down' : 'mdi-chevron-up'} fs-4`}></i>
                </Button>
            </div>

            <div className="pt-2 pb-2">
                <Container fluid className="px-1">
                    {/* Rows of Letters */}
                    {rows.map((row, rowIndex) => (
                        <div key={rowIndex} className="d-flex justify-content-center mb-2 gap-1 px-1">
                            {/* Staggering offsets */}
                            {rowIndex === 1 && <div style={{ width: '4%' }}></div>}
                            {rowIndex === 2 && <div style={{ width: '8%' }}></div>}

                            {row.map((key) => (
                                <Button
                                    key={key}
                                    color="white"
                                    className="key-btn fw-bold shadow-sm border d-flex align-items-center justify-content-center text-dark"
                                    onClick={() => handleKeyClick(key)}
                                    style={{ flex: 1, maxWidth: '9%', height: '48px', fontSize: '1.25rem', padding: 0, backgroundColor: '#f3f4f6', borderRadius: '5px' }}
                                >
                                    {key}
                                </Button>
                            ))}

                            {/* Backspace on the last row */}
                            {rowIndex === 2 && (
                                <Button
                                    color="light"
                                    className="key-btn fw-bold shadow-sm border-0 d-flex align-items-center justify-content-center text-dark"
                                    onClick={() => handleKeyClick('⌫')}
                                    style={{ flex: 1, maxWidth: '14%', height: '48px', fontSize: '1.4rem', padding: 0, borderRadius: '5px', marginLeft: '5px', backgroundColor: '#e5e7eb' }}
                                >
                                    <i className="mdi mdi-backspace-outline"></i>
                                </Button>
                            )}

                            {rowIndex === 1 && <div style={{ width: '4%' }}></div>}
                        </div>
                    ))}

                    {/* Bottom Row (Space Only) */}
                    <div className="d-flex justify-content-center mt-1 px-2 pb-1">
                        <Button
                            color="white"
                            className="space-btn fw-bold shadow-sm border text-dark"
                            onClick={() => handleKeyClick(' ')}
                            style={{ width: '50%', height: '38px', backgroundColor: '#fff', borderRadius: '5px' }}
                        >
                            espaço
                        </Button>
                    </div>
                </Container>
            </div>

            <style>{`
                .virtual-keyboard {
                    border-top: 1px solid rgba(0,0,0,0.05);
                }
                .backdrop-blur {
                     backdrop-filter: blur(10px);
                }
                .key-btn:active, .space-btn:active {
                    transform: scale(0.95);
                    background-color: #d1d5db !important;
                }
                /* Mobile optimization */
                @media (max-width: 576px) {
                    .key-btn {
                        font-size: 1rem !important;
                        height: 42px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default VirtualKeyboard;
