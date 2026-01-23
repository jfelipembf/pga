import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Alert } from 'reactstrap';

import pgaLogo from "../../assets/images/pgaLogo.png";
import poolImg from "../../assets/images/PGA_Gestao.png";
import { loginUser } from "../../store/actions";
import withRouter from 'components/Common/withRouter';

import "./Login.css";

const Login = ({ router }) => {
  const dispatch = useDispatch();
  const { error } = useSelector((state) => state.Login);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: Yup.object({
      email: Yup.string().email("E-mail inválido").required("Obrigatório"),
      password: Yup.string().required("Obrigatório"),
    }),
    onSubmit: (values) => {
      dispatch(loginUser(values, router.navigate));
    },
  });

  return (
    <div className="login-page">
      {/* Esquerda: Hero Visual */}
      <section className="login-hero">
        <img src={poolImg} alt="Piscina" className="hero-image" />
      </section>

      {/* Direita: Formulário Lateral */}
      <aside className="login-sidebar">
        <div className="login-content">

          <header className="brand-wrapper">
            <img src={pgaLogo} alt="PGA" />
            <h1 className="login-title">Acesse sua conta</h1>
            <p className="login-subtitle">Bem-vindo ao PGA Gestão de Piscinas</p>
          </header>

          {error && (
            <Alert color="danger" className="py-2 small border-0 shadow-sm">
              {typeof error === "string" ? error : "Erro de autenticação"}
            </Alert>
          )}

          <form onSubmit={formik.handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                className="form-control-minimal"
                placeholder="exemplo@pga.com.br"
                {...formik.getFieldProps('email')}
              />
              {formik.touched.email && formik.errors.email && (
                <span className="text-danger small">{formik.errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                className="form-control-minimal"
                placeholder="••••••••"
                {...formik.getFieldProps('password')}
              />
              {formik.touched.password && formik.errors.password && (
                <span className="text-danger small">{formik.errors.password}</span>
              )}
            </div>

            <div className="extra-links">
              <label className="text-muted d-flex align-items-center mb-0">
                <input type="checkbox" className="me-2" /> Lembrar
              </label>
              <Link to="/forgot-password" size="sm" className="text-primary text-decoration-none fw-medium">
                Esqueceu a senha?
              </Link>
            </div>

            <button type="submit" className="btn-login-dark">
              Entrar
            </button>
          </form>

          <footer className="login-footer">
            <p>© {new Date().getFullYear()} PGA Gestão</p>
          </footer>
        </div>
      </aside>
    </div>
  );
};

export default withRouter(Login);