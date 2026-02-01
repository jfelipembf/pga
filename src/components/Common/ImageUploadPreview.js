import React, { useState, useEffect } from "react"
import { Label } from "reactstrap"

const ImageUploadPreview = ({ currentImage, onImageSelect }) => {
    const [preview, setPreview] = useState(currentImage || null)

    // Sincroniza preview se currentImage mudar externamente
    useEffect(() => {
        setPreview(currentImage)
    }, [currentImage])

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const objectUrl = URL.createObjectURL(file)
            setPreview(objectUrl)
            onImageSelect(file)
        }
    }

    return (
        <div className="text-center mb-3">
            <div className="position-relative d-inline-block">
                <div
                    className="avatar-xl mx-auto rounded-circle overflow-hidden"
                    style={{
                        border: '3px solid #f1f5f7',
                        width: '120px',
                        height: '120px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center', // Centraliza ícone se não tiver imagem
                        backgroundColor: '#f8f9fa' // Cor de fundo suave
                    }}
                >
                    {preview ? (
                        <img
                            src={preview}
                            alt="Profile"
                            className="img-fluid h-100 w-100"
                            style={{ objectFit: 'cover' }}
                        />
                    ) : (
                        <i className="mdi mdi-account text-muted font-size-24"></i>
                    )}
                </div>
                <Label
                    htmlFor="profile-image-input" // ID ÚNICO
                    className="avatar-title bg-light text-primary rounded-circle pointer position-absolute bottom-0 end-0 shadow-sm"
                    style={{
                        width: '36px',
                        height: '36px',
                        cursor: 'pointer',
                        lineHeight: '36px', // Centraliza ícone verticalmente
                        right: '5px',
                        bottom: '5px'
                    }}
                >
                    <i className="mdi mdi-pencil font-size-16"></i>
                </Label>
                <input
                    id="profile-image-input"
                    type="file"
                    className="d-none"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleFileChange}
                />
            </div>
            <p className="text-muted mt-2 mb-0 font-size-12">
                Clique no ícone para alterar a foto
            </p>
        </div>
    )
}

export default ImageUploadPreview
