import React from 'react'
import { Link } from 'react-router-dom';
import { Row, Col, Label, Form, Alert, Input, FormFeedback, Spinner } from 'reactstrap';
import logoDark from "../../assets/images/pgaLogo.png";
import pgaGestao from "../../assets/images/PGA_Gestao.png";
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import PropTypes from "prop-types";

// Formik validation

import { useFormik } from "formik";
import withRouter from 'components/Common/withRouter';
import { LoginSchema } from '../../data/schemas/Auth/AuthSchema';

// actions
import { loginUser } from "../../store/actions";

const Login = props => {
  document.title = "Login | PGA System";

  const dispatch = useDispatch();

  const validation = useFormik({
    // enableReinitialize : use this  flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      email: "admin@themesbrand.com" || '',
      password: "123456" || '',
    },
    validationSchema: LoginSchema,
    onSubmit: (values) => {
      const { idTenant, idBranch } = props.router.params;
      dispatch(loginUser({ ...values, idTenant, idBranch }, props.router.navigate));
    }
  });


  const selectLoginState = (state) => state.Login;
  const LoginProperties = createSelector(
    selectLoginState,
    (login) => ({
      error: login.error,
      loading: login.loading
    })
  );

  const {
    error,
    loading
  } = useSelector(LoginProperties);

  // Tradutor de erros para mensagens amigáveis
  const translateError = (errorObj) => {
    if (!errorObj) return null;

    // Converte para string se for objeto
    const errorMessage = typeof errorObj === 'string' ? errorObj : (errorObj.message || JSON.stringify(errorObj));

    if (errorMessage.includes("auth/user-not-found") || errorMessage.includes("auth/wrong-password") || errorMessage.includes("auth/invalid-credential")) {
      return "Usuário ou senha incorretos. Verifique suas credenciais.";
    }
    if (errorMessage.includes("auth/too-many-requests")) {
      return "Muitas tentativas falhas. Tente novamente mais tarde.";
    }
    if (errorMessage.includes("network-request-failed")) {
      return "Erro de conexão. Verifique sua internet.";
    }
    if (errorMessage.includes("auth/invalid-email")) {
      return "Formato de e-mail inválido.";
    }
    // Caso genérico ou mensagem customizada do backend
    return errorMessage.replace("Firebase: ", "").replace("Error (", "").replace(").", "") || "Ocorreu um erro ao fazer login.";
  };


  return (
    <React.Fragment>
      <div className="container-fluid p-0">
        <Row className="g-0 vh-100">
          {/* Lado Esquerdo - Imagem PGA Gestao */}
          <Col xs={12} md={8} lg={9} className="d-none d-md-block">
            <div
              style={{
                backgroundImage: `url(${pgaGestao})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: '100%',
                width: '100%',
                position: 'relative'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.2)', // Overlay suave
                display: 'flex',
                alignItems: 'flex-end',
                padding: '60px'
              }}>
                {/* Texto removido conforme solicitado */}
              </div>
            </div>
          </Col>

          {/* Lado Direito - Formulário de Login */}
          <Col xs={12} md={4} lg={3} className="bg-white d-flex align-items-center justify-content-center">
            <div className="w-100 p-4" style={{ maxWidth: '400px' }}>
              <div className="text-center mb-5">
                <Link to="/" className="d-block auth-logo">
                  <img src={logoDark} alt="" height="140" className="auth-logo-dark" />
                </Link>
              </div>

              <h4 className="font-size-22 text-center fw-bold mb-2">Bem-vindo!</h4>
              <p className="text-muted text-center mb-4">Faça login para continuar.</p>

              <Form
                className="form-horizontal"
                onSubmit={(e) => {
                  e.preventDefault();
                  validation.handleSubmit();
                  return false;
                }}
              >
                {error ? <Alert color="danger" className="rounded-3 shadow-sm">{translateError(error)}</Alert> : null}

                <div className="mb-4">
                  <Label className="form-label font-size-14">Email ou Usuário</Label>
                  <Input
                    name="email"
                    className="form-control form-control-lg rounded-3 border-light bg-light"
                    placeholder="Ex: admin@pga.com"
                    type="email"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    value={validation.values.email || ""}
                    invalid={
                      validation.touched.email && validation.errors.email ? true : false
                    }
                    style={{ fontSize: '15px' }}
                  />
                  {validation.touched.email && validation.errors.email ? (
                    <FormFeedback type="invalid">{validation.errors.email}</FormFeedback>
                  ) : null}
                </div>

                <div className="mb-4">
                  <Label className="form-label font-size-14">Senha</Label>
                  <Input
                    name="password"
                    value={validation.values.password || ""}
                    type="password"
                    className="form-control form-control-lg rounded-3 border-light bg-light"
                    placeholder="Digite sua senha"
                    onChange={validation.handleChange}
                    onBlur={validation.handleBlur}
                    invalid={
                      validation.touched.password && validation.errors.password ? true : false
                    }
                    style={{ fontSize: '15px' }}
                  />
                  {validation.touched.password && validation.errors.password ? (
                    <FormFeedback type="invalid">{validation.errors.password}</FormFeedback>
                  ) : null}
                </div>

                <div className="form-check mb-4">
                  <input type="checkbox" className="form-check-input" id="customControlInline" />
                  <label className="form-check-label text-muted" htmlFor="customControlInline">Lembrar-me</label>
                </div>

                <div className="d-grid">
                  <button
                    className="btn btn-primary btn-lg rounded-3 waves-effect waves-light fw-medium shadow-sm d-flex align-items-center justify-content-center gap-2"
                    type="submit"
                    disabled={loading}
                  >
                    {loading && <Spinner size="sm" color="light" />}
                    {loading ? "Acessando..." : "Acessar Painel"}
                  </button>
                </div>
              </Form>

              <div className="mt-5 text-center">
                <p className="text-muted mb-0" style={{ fontSize: '10px' }}>© {new Date().getFullYear()} PGA System.</p>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </React.Fragment>
  )
}

export default withRouter(Login);

Login.propTypes = {
  history: PropTypes.object,
  router: PropTypes.object
};
