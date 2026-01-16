import { useState } from "react";
import { uploadImage } from "../../../helpers/storage_helper";
import { formatToE164 } from "../utils/academyUtils";
import { slugify } from "../../../helpers/url_sanitizer";
import useAcademies from "./useAcademies";
import { useToast } from "../../../components/Common/ToastProvider";

/**
 * Hook for handling form mutations and actions for Academy Profile.
 */
export const useAcademyProfileActions = ({
    academy,
    initialFormData,
    tenantBranches,
    onSuccess,
    onNavigate
}) => {
    const { createAcademy, updateAcademy } = useAcademies();
    const [localData, setLocalData] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const { addToast } = useToast();

    const formData = localData || initialFormData;

    const handleNewBranch = () => {
        const tenantPrefix = slugify(academy?.companyInfo?.slug || (academy?.slug?.includes('/') ? academy.slug.split('/')[0] : 'academia'));
        const branchCount = tenantBranches.length;
        const nextSlug = `${tenantPrefix}/unidade-${branchCount + 1}`;

        setLocalData({
            ...initialFormData,
            tradeName: `${initialFormData.tradeName} (Nova Unidade)`,
            slug: nextSlug,
            owners: [academy?.owner?.uid].filter(Boolean),
            newOwners: []
        });
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !academy) return;

        setSubmitting(true);
        try {
            const path = `academies/${Date.now()}_${file.name}`;
            const photoUrl = await uploadImage(file, path);

            await updateAcademy({
                id: academy.id,
                tenantId: academy.tenantId,
                photo: photoUrl
            });

            setLocalData(prev => ({
                ...(prev || initialFormData),
                photo: photoUrl
            }));

            addToast({
                title: "Sucesso",
                message: "Foto atualizada com sucesso",
                color: "success"
            });
        } catch (error) {
            console.error("Photo upload failed", error);
            addToast({
                title: "Erro",
                message: "Falha ao atualizar foto",
                color: "danger"
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSave = async () => {
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                phone: formatToE164(formData.phone),
                owner: {
                    ...formData.owner,
                    phone: formatToE164(formData.owner?.phone)
                }
            };
            const result = await createAcademy(payload);
            setLocalData(null);
            if (result?.id) {
                onNavigate(result.id);
            }
            onSuccess("save");
            addToast({
                title: "Sucesso",
                message: "Acdemia salva com sucesso",
                color: "success"
            });
        } catch (error) {
            console.error("Save failed", error);
            addToast({
                title: "Erro",
                message: "Falha ao salvar dados",
                color: "danger"
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        setSubmitting(true);
        try {
            const payload = {
                id: academy.id,
                tenantId: academy.tenantId,
                ...formData,
                phone: formatToE164(formData.phone),
                owner: {
                    ...formData.owner,
                    phone: formatToE164(formData.owner?.phone)
                }
            };
            await updateAcademy(payload);
            setLocalData(null);
            onSuccess("update");
            addToast({
                title: "Sucesso",
                message: "Dados atualizados com sucesso",
                color: "success"
            });
        } catch (error) {
            console.error("Update failed", error);
            addToast({
                title: "Erro",
                message: "Falha ao atualizar dados",
                color: "danger"
            });
        } finally {
            setSubmitting(false);
        }
    };

    return {
        formData,
        setLocalData,
        submitting,
        handleNewBranch,
        handlePhotoChange,
        handleSave,
        handleUpdate,
        clearLocalData: () => setLocalData(null)
    };
};
