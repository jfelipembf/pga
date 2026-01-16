import { getStatusLabel, getStatusColor } from "../../../constants/status";
import { getGenderLabel } from "../../../constants/gender";

export const formatUserForTable = (user) => {
    return {
        ...user,
        statusLabel: getStatusLabel(user.status || "active"), // Default to active if missing
        statusColor: getStatusColor(user.status || "active"),
        genderLabel: getGenderLabel(user.gender),
        fullName: `${user.firstName} ${user.lastName}`,
        age: user.birthdate ? calculateAge(user.birthdate) : "-",
    };
};

const calculateAge = (birthdate) => {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};
