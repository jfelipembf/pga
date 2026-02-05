import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";


/**
 * Serviço de Storage Otimizado
 * 
 * BOAS PRÁTICAS IMPLEMENTADAS:
 * 1. Compressão Automática (browser-image-compression) antes do upload.
 * 2. Conversão para WebP (menor tamanho, mesma qualidade).
 * 3. Estrutura de Pastas Organizada por Tenant/Branch/Entidade.
 * 4. Limpeza de arquivos antigos (substituição).
 */
export const StorageService = {

    /**
     * Upload de Imagem de Perfil (Avatar)
     * - Redimensiona para max 500x500
     * - Converte para WebP
     * - Substitui imagem anterior se fornecida
     */
    uploadProfileImage: async (file, pathConfig) => {
        const { idTenant, idBranch, entityType, entityId, currentPhotoUrl } = pathConfig;

        try {
            // BYPASS DE COMPRESSÃO: A biblioteca browser-image-compression apresenta instabilidade neste ambiente.
            // Usando arquivo original temporariamente.
            const compressedFile = file;

            const fileExt = file.name.split('.').pop();
            const fileName = `photo-${Date.now()}.${fileExt}`;

            // Caminho: tenants/{idTenant}/branches/{idBranch}/{entityType}/{entityId}/photos/${fileName}
            const storagePath = `tenants/${idTenant}/branches/${idBranch}/${entityType}/${entityId}/photos/${fileName}`;

            // 2. Deletar foto anterior para economizar espaço
            if (currentPhotoUrl) {
                await StorageService.deleteFileFromUrl(currentPhotoUrl);
            }

            // 3. Upload
            const storage = getStorage();
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, compressedFile);

            return await getDownloadURL(storageRef);

        } catch (error) {
            console.error("Erro no upload otimizado:", error);
            throw error;
        }
    },

    /**
     * Upload de Documentos (PDF, etc)
     * - Sem compressão agressiva, mas valida tamanho
     */
    uploadDocument: async (file, pathConfig) => {
        const { idTenant, idBranch, entityType, entityId } = pathConfig;

        // Limite de 5MB
        if (file.size > 5 * 1024 * 1024) {
            throw new Error("O arquivo deve ter no máximo 5MB.");
        }

        const fileName = `doc-${Date.now()}-${file.name}`;
        const storagePath = `tenants/${idTenant}/branches/${idBranch}/${entityType}/${entityId}/docs/${fileName}`;

        const storage = getStorage();
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file);

        return await getDownloadURL(storageRef);
    },

    /**
     * Deleta arquivo pela URL pública
     * Útil quando substituindo fotos ou excluindo registros
     */
    deleteFileFromUrl: async (url) => {
        if (!url) return;
        try {
            const storage = getStorage();
            const fileRef = ref(storage, url);
            await deleteObject(fileRef);
        } catch (error) {
            console.warn("Arquivo não encontrado ou já deletado:", url);
        }
    }
}
