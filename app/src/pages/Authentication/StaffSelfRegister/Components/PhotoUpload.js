import React from "react"
import { Button } from "reactstrap"

const PhotoUpload = ({ preview, handlePhotoClick, handlePhotoChange, fileInputRef }) => {
    return (
        <div className="d-flex flex-column align-items-center mb-4 mt-4">
            <div
                onClick={handlePhotoClick}
                className="rounded-circle d-flex align-items-center justify-content-center bg-light cursor-pointer border position-relative"
                style={{ width: 100, height: 100, overflow: 'hidden', cursor: 'pointer' }}
            >
                {preview ? (
                    <img src={preview} alt="Preview" className="w-100 h-100" style={{ objectFit: 'cover' }} />
                ) : (
                    <i className="mdi mdi-camera fs-2 text-muted"></i>
                )}
            </div>
            <Button color="link" size="sm" onClick={handlePhotoClick}>
                {preview ? "Alterar Foto" : "Adicionar Foto"}
            </Button>
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
            />
        </div>
    )
}

export default PhotoUpload
