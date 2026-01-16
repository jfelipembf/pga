import * as Yup from "yup"

export const initialValues = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "Masculino",
    birthDate: "",

    cep: "",
    state: "",
    city: "",
    neighborhood: "",
    address: "",
    number: "",

    password: "",
    confirmPassword: ""
}

export const validationSchema = Yup.object({
    firstName: Yup.string().required("Nome é obrigatório"),
    lastName: Yup.string().required("Sobrenome é obrigatório"),
    email: Yup.string().email("E-mail inválido").required("E-mail é obrigatório"),
    phone: Yup.string().required("Telefone é obrigatório"),
    gender: Yup.string().required("Sexo é obrigatório"),
    birthDate: Yup.date().required("Data de nascimento é obrigatória"),

    cep: Yup.string().required("CEP é obrigatório"),
    state: Yup.string().required("Estado é obrigatório"),
    city: Yup.string().required("Cidade é obrigatória"),
    neighborhood: Yup.string().required("Bairro é obrigatório"),
    address: Yup.string().required("Endereço é obrigatório"),
    number: Yup.string().required("Número é obrigatório"),

    password: Yup.string().min(6, "A senha deve ter pelo menos 6 caracteres").required("Senha é obrigatória"),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], "As senhas devem coincidir")
        .required("Confirmação de senha é obrigatória")
})
