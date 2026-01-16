import { useNavigate } from "react-router-dom";
import { useAcademyProfileUI } from "./useAcademyProfileUI";
import { useAcademyProfileData } from "./useAcademyProfileData";
import { useAcademyProfileActions } from "./useAcademyProfileActions";

/**
 * Main orchestrator hook for Academy Profile.
 * Combines UI state, Data fetching, and Actions.
 */
export const useAcademyProfile = (id) => {
    const navigate = useNavigate();

    // 1. Manage UI State
    const ui = useAcademyProfileUI();

    // 2. Manage Data
    const data = useAcademyProfileData(id, ui.isCreatingNew);

    // 3. Manage Actions
    const actions = useAcademyProfileActions({
        academy: data.academy,
        initialFormData: data.initialFormData,
        tenantBranches: data.tenantBranches,
        onSuccess: (type) => {
            if (type === "save") ui.setIsCreatingNew(false);
            if (type === "update") ui.setIsEditing(false);
        },
        onNavigate: (branchId) => {
            navigate(`/academies/${branchId}`);
        }
    });

    const handleSelectBranch = (branchId) => {
        ui.setIsCreatingNew(false);
        ui.setIsEditing(false);
        actions.clearLocalData();
        navigate(`/academies/${branchId}`);
    };

    const handleCancel = () => {
        ui.setIsCreatingNew(false);
        ui.setIsEditing(false);
        actions.clearLocalData();
    };

    const handleStartNewBranch = () => {
        ui.setIsCreatingNew(true);
        ui.setIsEditing(false);
        actions.handleNewBranch();
    };

    return {
        // Data & State
        academy: data.academy,
        staff: data.staff,
        loading: data.loading,
        profile: data.profile,
        tenantBranches: data.tenantBranches,
        initialFormData: data.initialFormData,

        // UI State
        activeTab: ui.activeTab,
        setActiveTab: ui.setActiveTab,
        isCreatingNew: ui.isCreatingNew,
        isEditing: ui.isEditing,
        setIsEditing: ui.setIsEditing,

        // Form & Actions
        formData: actions.formData,
        setLocalData: actions.setLocalData,
        submitting: actions.submitting,

        // Handlers
        handleSelectBranch,
        handleNewBranch: handleStartNewBranch,
        handleCancel,
        handlePhotoChange: actions.handlePhotoChange,
        handleSave: actions.handleSave,
        handleUpdate: actions.handleUpdate
    };
};
