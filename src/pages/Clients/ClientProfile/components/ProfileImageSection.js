
import React, { useState } from 'react';
import { Button } from 'reactstrap';
import CameraCapture from '../../../../components/Common/CameraCapture';

const ProfileImageSection = ({ photoUrl, onPhotoCaptured }) => {
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(photoUrl);

    const handleCapture = (file, base64) => {
        setPreviewUrl(base64);
        onPhotoCaptured(file);
    };

    return (
        <div className="d-flex flex-column align-items-center mb-4 pt-3">
            <div className="position-relative">
                <div
                    className="avatar-xl rounded-circle border border-3 border-white shadow-sm overflow-hidden bg-soft-primary d-flex align-items-center justify-content-center"
                    style={{ width: '150px', height: '150px' }}
                >
                    {previewUrl ? (
                        <img src={previewUrl} alt="Profile" className="img-fluid w-100 h-100 object-fit-cover" />
                    ) : (
                        <i className="mdi mdi-account text-primary" style={{ fontSize: '80px' }}></i>
                    )}
                </div>
                <Button
                    color="primary"
                    size="sm"
                    className="position-absolute bottom-0 end-0 rounded-circle shadow-sm"
                    style={{ width: '40px', height: '40px' }}
                    onClick={() => setIsCameraOpen(true)}
                >
                    <i className="mdi mdi-camera font-size-18"></i>
                </Button>
            </div>
            <div className="mt-3 text-center">
                <h6 className="mb-1 fw-bold text-dark">Foto do Aluno</h6>
                <p className="text-muted font-size-12 mb-0">Use para identificação e biometria facial</p>
            </div>

            <CameraCapture
                isOpen={isCameraOpen}
                toggle={() => setIsCameraOpen(!isCameraOpen)}
                onCapture={handleCapture}
            />
        </div>
    );
};

export default ProfileImageSection;
