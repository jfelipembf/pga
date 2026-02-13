
import { useFormik } from "formik";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

// Services & Hooks
import CompanyService from "../../../../services/Company/CompanyService";
import { useTenant } from "../../../../hooks/useTenant";
import { usePhotoUpload } from "../../../../hooks/usePhotoUpload";
import { CompanySchema } from "../../../../data/schemas/Company/CompanySchema";

// Initial Values defined outside to have stable reference
const initialValues = {
    name: "",
    openingDate: "",
    email: "",
    phone: "",
    // Address
    zipCode: "",
    state: "",
    city: "",
    neighborhood: "",
    street: "",
    number: "",
    complement: "",
    // Managers
    managers: [
        { name: "", email: "", phone: "" }
    ]
};

export const useCompanyForm = () => {
    const { idTenant, isReady } = useTenant();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Photo Upload Hook
    const {
        selectedFile,
        preview,
        handlePhotoChange,
        updatePreview
    } = usePhotoUpload();

    const formik = useFormik({
        initialValues,
        validationSchema: CompanySchema,
        onSubmit: async (values) => {
            setSaving(true);
            try {
                let logoUrl = preview;

                // Processar upload de foto apenas se houver novo arquivo selecionado
                if (selectedFile) {
                    logoUrl = await CompanyService.uploadLogo(idTenant, selectedFile);
                }

                const companyData = {
                    ...values,
                    logo: logoUrl
                };

                await CompanyService.updateCompanyData(idTenant, companyData);
                toast.success("Dados da empresa salvos com sucesso!");
            } catch (error) {
                console.error("Error saving company data:", error);
                toast.error("Erro ao salvar dados da empresa.");
            } finally {
                setSaving(false);
            }
        }
    });

    // Fetch existing data
    useEffect(() => {
        const fetchData = async () => {
            if (!isReady) return;
            setLoading(true);
            try {
                const data = await CompanyService.getCompanyData(idTenant);
                if (data) {
                    formik.setValues({
                        ...initialValues,
                        ...data,
                        managers: data.managers && data.managers.length > 0 ? data.managers : initialValues.managers
                    });
                    if (data.logo) {
                        updatePreview(data.logo);
                    }
                }
            } catch (error) {
                console.error("Error fetching company data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (isReady) {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idTenant, updatePreview, isReady]);

    return {
        formik,
        loading,
        saving,
        // Photo
        photoPreview: preview,
        handlePhotoChange
    };
};
