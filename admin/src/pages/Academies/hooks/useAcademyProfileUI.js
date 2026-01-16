import { useState } from "react";

/**
 * Hook for managing the UI state of the Academy Profile.
 */
export const useAcademyProfileUI = () => {
    const [activeTab, setActiveTab] = useState("Perfil");
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const toggleEditing = (val) => setIsEditing(val);
    const toggleCreatingNew = (val) => setIsCreatingNew(val);

    return {
        activeTab,
        setActiveTab,
        isCreatingNew,
        setIsCreatingNew: toggleCreatingNew,
        isEditing,
        setIsEditing: toggleEditing
    };
};
