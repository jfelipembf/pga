
import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Spinner } from 'reactstrap';

const CameraCapture = ({ isOpen, toggle, onCapture }) => {
    const webcamRef = useRef(null);
    const [imgSrc, setImgSrc] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImgSrc(imageSrc);
    }, [webcamRef]);

    const handleConfirm = () => {
        if (imgSrc) {
            // Convert base64 to File
            fetch(imgSrc)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "captured-photo.webp", { type: "image/webp" });
                    onCapture(file, imgSrc);
                    toggle();
                    setImgSrc(null);
                });
        }
    };

    const handleRetake = () => {
        setImgSrc(null);
    };

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: "user"
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="lg">
            <ModalHeader toggle={toggle}>
                <i className="mdi mdi-camera me-2 text-primary"></i>
                Capturar Foto do Aluno
            </ModalHeader>
            <ModalBody className="p-0 bg-dark overflow-hidden position-relative" style={{ minHeight: '400px' }}>
                {!imgSrc ? (
                    <div className="d-flex flex-column align-items-center">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/webp"
                            videoConstraints={videoConstraints}
                            style={{ width: '100%', height: 'auto' }}
                            onUserMedia={() => setIsCapturing(true)}
                        />
                        {!isCapturing && (
                            <div className="position-absolute top-50 start-50 translate-middle text-white text-center">
                                <Spinner color="light" />
                                <p className="mt-2 text-white">Solicitando permissão da câmera...</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <img src={imgSrc} alt="captured" style={{ width: '100%', height: 'auto' }} />
                )}
            </ModalBody>
            <ModalFooter className="justify-content-center border-0">
                {!imgSrc ? (
                    <Button color="primary" className="rounded-pill px-5 py-2 shadow" onClick={capture} disabled={!isCapturing}>
                        <i className="mdi mdi-camera-iris font-size-18 me-2"></i>
                        Capturar Agora
                    </Button>
                ) : (
                    <div className="d-flex gap-3">
                        <Button color="secondary" className="rounded-pill px-4" onClick={handleRetake}>
                            <i className="mdi mdi-refresh me-2"></i>
                            Tirar Outra
                        </Button>
                        <Button color="success" className="rounded-pill px-4 shadow" onClick={handleConfirm}>
                            <i className="mdi mdi-check me-2"></i>
                            Usar Esta Foto
                        </Button>
                    </div>
                )}
            </ModalFooter>
        </Modal>
    );
};

export default CameraCapture;
