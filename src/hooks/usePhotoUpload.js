import { useState, useCallback } from 'react';
import { StorageService } from '../services/Core/StorageService';

/**
 * Hook centralizado para gerenciamento de upload de fotos (preview e envio).
 * Utiliza o FileReader para preview local e StorageService para upload.
 */
export const usePhotoUpload = (initialPreview = null) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(initialPreview);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Manipula a seleção do arquivo via Input field
     */
    const handlePhotoChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    /**
     * Realiza o upload da foto selecionada usando o StorageService
     * @param {Object} pathConfig - Configuração do path ({ idTenant, idBranch, entityType, entityId, currentPhotoUrl })
     * @returns {Promise<string|null>} URL da foto ou null se não houver arquivo selecionado
     */
    const uploadPhoto = useCallback(async (pathConfig) => {
        if (!selectedFile) return null;

        try {
            setUploading(true);
            setError(null);

            const url = await StorageService.uploadProfileImage(selectedFile, pathConfig);

            // Atualiza preview com URL final (opcional, mas bom para confirmar)
            setPreview(url);
            return url;

        } catch (err) {
            console.error("Erro no upload de foto (Hook):", err);
            setError(err.message);
            throw err;
        } finally {
            setUploading(false);
        }
    }, [selectedFile]);

    /**
     * Reseta o estado da foto
     */
    const resetPhoto = useCallback(() => {
        setSelectedFile(null);
        setPreview(initialPreview);
        setError(null);
    }, [initialPreview]);

    /**
     * Atualiza o preview manualmente (ex: ao editar um registro existente)
     */
    const updatePreview = useCallback((url) => {
        setPreview(url);
    }, []);

    return {
        selectedFile,
        preview,
        uploading,
        error,
        handlePhotoChange,
        uploadPhoto,
        resetPhoto,
        updatePreview
    };
};
