
import * as Yup from "yup";

/**
 * Schema Validation for Company Form
 */
export const CompanySchema = Yup.object().shape({
    name: Yup.string().required("Nome da empresa é obrigatório"),
    email: Yup.string().email("Email inválido").required("Email é obrigatório"),
    phone: Yup.string().required("Telefone é obrigatório"),

    // Address
    zipCode: Yup.string().required("CEP é obrigatório"),
    state: Yup.string().required("Estado é obrigatório"),
    city: Yup.string().required("Cidade é obrigatória"),
    neighborhood: Yup.string().required("Bairro é obrigatório"),
    street: Yup.string().required("Endereço é obrigatório"),
    number: Yup.string().required("Número é obrigatório"),

    // Managers
    managers: Yup.array().of(
        Yup.object().shape({
            name: Yup.string().required("Nome é obrigatório"),
            email: Yup.string().email("Email inválido").required("Email é obrigatório"),
            phone: Yup.string().required("Telefone é obrigatório")
        })
    )
});
