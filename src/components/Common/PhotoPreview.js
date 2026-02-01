import React from "react"
import { Input, Label } from "reactstrap"

const PhotoPreview = ({
    inputId,
    preview,
    placeholder = "Foto",
    onChange,
    size = 160,
    rounded = false,
    cameraStyle,
}) => {


    return (
        <div className="position-relative d-inline-block">
            <div
                className={`basic-modal__photo border bg-light d-flex align-items-center justify-content-center text-muted fw-semibold ${rounded ? "rounded-circle" : "rounded"
                    }`}
                style={{
                    width: size,
                    height: size,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    overflow: 'hidden',
                    backgroundImage: preview
                        ? `url(${preview})`
                        : (placeholder && placeholder.startsWith('data:image') ? `url("${placeholder}")` : "none"),
                }}
            >
                {!preview && (!placeholder || !placeholder.startsWith('data:image')) && (
                    <div className="text-center p-2">
                        <i className="mdi mdi-camera font-size-24 d-block mb-1"></i>
                        <span>{placeholder}</span>
                    </div>
                )}
            </div>
            <Label htmlFor={inputId} className="position-absolute basic-modal__camera bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow"
                style={{
                    ...cameraStyle,
                    width: 36,
                    height: 36,
                    bottom: 0,
                    right: 0,
                    cursor: 'pointer'
                }}>
                <i className="mdi mdi-camera font-size-18" />
            </Label>
            <Input
                type="file"
                id={inputId}
                accept="image/*"
                onChange={onChange}
                style={{ display: "none" }}
            />
        </div>
    )
}

export default PhotoPreview
