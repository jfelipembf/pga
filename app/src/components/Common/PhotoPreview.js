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
    <div className="position-relative">
      <div
        className={`basic-modal__photo border bg-light d-flex align-items-center justify-content-center text-muted fw-semibold ${rounded ? "rounded-circle" : "rounded"
          }`}
        style={{
          width: size,
          height: size,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundImage: preview
            ? `url(${preview})`
            : (placeholder && placeholder.startsWith('data:image') ? `url("${placeholder}")` : "none"),
        }}
      >
        {!preview && (!placeholder || !placeholder.startsWith('data:image')) && placeholder}
      </div>
      <Label htmlFor={inputId} className="position-absolute basic-modal__camera" style={cameraStyle}>
        <i className="mdi mdi-camera" />
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
