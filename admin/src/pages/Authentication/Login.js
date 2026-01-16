import React from 'react'
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody, Label, Form, Alert, Input, FormFeedback } from 'reactstrap';
import logoDark from "../../assets/images/logo-dark.png";
import logoLight from "../../assets/images/logo-dark.png";
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import PropTypes from "prop-types";

// Formik validation
import * as Yup from "yup";
import { useFormik } from "formik";
import withRouter from 'components/Common/withRouter';

// actions
import { loginUser, socialLogin } from "../../store/actions";

const Login = props => {
  document.title = "Login | Lexa - Responsive Bootstrap 5 Admin Dashboard";

  const dispatch = useDispatch();

  const validation = useFormik({
    // enableReinitialize : use this  flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      email: "admin@themesbrand.com" || '',
      password: "123456" || '',
    },
    validationSchema: Yup.object({
      email: Yup.string().required("Por favor, insira seu e-mail"),
      password: Yup.string().required("Por favor, insira sua senha"),
    }),
    onSubmit: (values) => {
      dispatch(loginUser(values, props.router.navigate));
    }
  });


  const selectLoginState = (state) => state.Login;
  const LoginProperties = createSelector(
    selectLoginState,
    (login) => ({
      error: login.error
    })
  );

  const {
    error
  } = useSelector(LoginProperties);

  const signIn = type => {
    dispatch(socialLogin(type, props.router.navigate));
  };

  //for facebook and google authentication
  const socialResponse = type => {
    signIn(type);
  };


  return (
    <React.Fragment>
      <div className="account-pages my-5 pt-sm-5">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6} xl={5}>
              <Card className="overflow-hidden">
                <CardBody className="pt-0">

                  <h3 className="text-center mt-5 mb-4">
                    <Link to="/" className="d-block auth-logo">
                      <img src={logoDark} alt="" height="30" className="auth-logo-dark" />
                      <img src={logoLight} alt="" height="30" className="auth-logo-light" />
                    </Link>
                  </h3>

                  <div className="p-3">
                    <h4 className="text-muted font-size-18 mb-1 text-center">Bem-vindo de volta!</h4>
                    <p className="text-muted text-center">Faça login para continuar no Painel.</p>
                    <Form
                      className="form-horizontal mt-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        validation.handleSubmit();
                        return false;
                      }}
                    >
                      {error ? <Alert color="danger">{error}</Alert> : null}
                      <div className="mb-3">
                        <Label htmlFor="username">E-mail</Label>
                        <Input
                          name="email"
                          className="form-control"
                          placeholder="Insira o e-mail"
                          type="email"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.email || ""}
                          invalid={
                            validation.touched.email && validation.errors.email ? true : false
                          }
                        />
                        {validation.touched.email && validation.errors.email ? (
                          <FormFeedback type="invalid">{validation.errors.email}</FormFeedback>
                        ) : null}
                      </div>
                      <div className="mb-3">
                        <Label htmlFor="userpassword">Senha</Label>
                        <Input
                          name="password"
                          value={validation.values.password || ""}
                          type="password"
                          placeholder="Insira a senha"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          invalid={
                            validation.touched.password && validation.errors.password ? true : false
                          }
                        />
                        {validation.touched.password && validation.errors.password ? (
                          <FormFeedback type="invalid">{validation.errors.password}</FormFeedback>
                        ) : null}
                      </div>
                      <Row className="mb-3 mt-4">
                        <div className="col-6">
                          <div className="form-check">
                            <input type="checkbox" className="form-check-input" id="customControlInline" />
                            <label className="form-check-label" htmlFor="customControlInline">Lembrar-me
                            </label>
                          </div>
                        </div>
                        <div className="col-6 text-end">
                          <button className="btn btn-primary w-md waves-effect waves-light" type="submit">Entrar</button>
                        </div>
                      </Row>
                      <Row className="form-group mb-0">
                        <div className="col-12 mt-4">
                          <Link to="/forgot-password" className="text-muted"><i className="mdi mdi-lock"></i> Esqueceu sua senha?</Link>
                        </div>
                      </Row>
                    </Form>
                  </div>
                </CardBody>
              </Card>
              <Link
                to="#"
                className="social-list-item bg-danger text-white border-danger"
                onClick={e => {
                  e.preventDefault();
                  socialResponse("google");
                }}
              >
                <i className="mdi mdi-google" />
              </Link>
              <div className="mt-5 text-center">
                <p>Não tem uma conta? <Link to="/register" className="text-primary"> Cadastre-se agora </Link></p>
                © {new Date().getFullYear()} Painel Swim <span className="d-none d-sm-inline-block"> - Desenvolvido com <i className="mdi mdi-heart text-danger"></i> por Felipe Macedo.</span>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

    </React.Fragment>
  )
}

export default withRouter(Login);

Login.propTypes = {
  history: PropTypes.object,
};
