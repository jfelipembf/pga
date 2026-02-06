import * as Yup from "yup";

export const loginSchema = Yup.object({
    email: Yup.string().required("Por favor, digite seu email"),
    password: Yup.string().required("Por favor, digite sua senha"),
});

export const registerSchema = Yup.object({
    email: Yup.string().email("Email inválido").required("Por favor, digite seu email"),
    username: Yup.string().required("Por favor, digite seu usuário"),
    password: Yup.string().required("Por favor, digite sua senha"),
});

export const forgotPasswordSchema = Yup.object({
    email: Yup.string().email("Email inválido").required("Por favor, digite seu email"),
});
