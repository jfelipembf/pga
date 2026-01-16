import { useMemo } from "react";
import poolImage from "../../../assets/images/pool.jpg";
import useAcademies from "./useAcademies";
import useBranchStaff from "./useBranchStaff";

/**
 * Hook for fetching and organizing Academy Profile data.
 */
export const useAcademyProfileData = (id, isCreatingNew) => {
    const { academies, loading: academiesLoading } = useAcademies();

    // Find the current branch
    const academy = useMemo(() => academies.find(a => a.id === id), [academies, id]);

    // Fetch staff for the branch
    const { staff, loading: staffLoading } = useBranchStaff(academy?.tenantId, academy?.id);

    // Find all branches for this tenant
    const tenantBranches = useMemo(() => {
        if (!academy) return [];
        return academies.filter(a => a.tenantId === academy.tenantId);
    }, [academies, academy]);

    // Derived profile state for header
    const profile = useMemo(() => {
        if (isCreatingNew) return {
            id: "NOVA",
            name: "Nova Unidade",
            photo: null,
            cover: poolImage,
            status: "Sendo Criado",
            statusColor: "warning"
        };
        if (!academy) return null;
        return {
            id: academy.academiesId || "---",
            name: academy.tradeName || academy.name || "Sem Nome",
            photo: academy.photo || academy.companyInfo?.photo || null,
            cover: poolImage,
            status: academy.isActive ? "Ativo" : "Inativo",
            statusColor: academy.isActive ? "success" : "danger"
        };
    }, [academy, isCreatingNew]);

    // Initial data for the form
    const initialFormData = useMemo(() => {
        if (isCreatingNew && academy) {
            return {
                companyInfo: { ...academy.companyInfo },
                tenantId: academy.tenantId,
                businessName: academy.companyInfo?.businessName,
                tradeName: academy.companyInfo?.tradeName,
                cnpj: academy.companyInfo?.cnpj,
                website: academy.companyInfo?.website,
                address: {},
                contactEmail: "",
                contactPhone: "",
                slug: "",
                owner: { ...academy.owner },
                ownerUid: academy.ownerUid,
            };
        }
        if (!academy) return null;
        return {
            ...academy,
            businessName: academy.companyInfo?.businessName || academy.businessName,
            tradeName: academy.companyInfo?.tradeName || academy.tradeName || academy.name,
            cnpj: academy.companyInfo?.cnpj || academy.cnpj,
            website: academy.companyInfo?.website || academy.website,
            email: academy.contactEmail || academy.email || academy.companyInfo?.email,
            phone: academy.contactPhone || academy.phone || academy.companyInfo?.phone,
            owner: academy.owner || {},
            address: academy.address || {},
            ownerAddress: academy.owner?.address || academy.ownerAddress || {}
        };
    }, [academy, isCreatingNew]);

    return {
        academy,
        staff,
        tenantBranches,
        profile,
        initialFormData,
        loading: academiesLoading || staffLoading
    };
};
