
import { useFormik } from "formik";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

// Services & Hooks
import CompanyService from "../../../../services/Company/CompanyService";
import { useTenant } from "../../../../hooks/useTenant";
import { usePhotoUpload } from "../../../../hooks/usePhotoUpload";
import { useAddressLookup } from "../../../../hooks/useAddressLookup";
import { CompanySchema } from "../schemas/CompanySchema";

export const useCompanyForm = () => {
    const { idTenant } = useTenant();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Photo Upload Hook
    const {
        selectedFile,
        preview,
        handlePhotoChange,
        updatePreview
    } = usePhotoUpload();

    // Initial Values
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
            } catch (error) {
                console.error("Error saving company data:", error);
                toast.error("Erro ao salvar dados da empresa.");
            } finally {
                setSaving(false);
            }
        }
    });

    // Address Hook (passing formik instance)
    const {
        handleCepBlur: handleCepBlurHook,
        isLoadingCep
    } = useAddressLookup(formik);

    // Fetch existing data
    useEffect(() => {
        const fetchData = async () => {
            if (!idTenant) return;
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

        fetchData();
    }, [idTenant, updatePreview]);

    // Wrapper for CEP blur to ensure formik blur is also called if needed, 
    // although useAddressLookup might not call formik.handleBlur(e) directly on event, check implementation?
    // Implementation: handleCepBlur(e) takes event, but updates fields directly. 
    // Usually we want formik.handleBlur(e) to mark field as touched.
    const handleCepBlur = (e) => {
        formik.handleBlur(e);
        handleCepBlurHook(e);
    };

    return {
        formik,
        loading,
        saving,
        // Photo
        photoPreview: preview,
        handlePhotoChange,
        // Address
        handleCepBlur,
        isLoadingCep
    };
};
