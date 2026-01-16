import React from 'react'
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody, Label, Form, Alert, Input, FormFeedback } from 'reactstrap';
import pgaLogo from "../../assets/images/pgaLogo.png";
import poolImg from "../../assets/images/pool.jpg";
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";

// Formik validation
import * as Yup from "yup";
import { useFormik } from "formik";
import withRouter from 'components/Common/withRouter';

// actions
import { loginUser } from "../../store/actions";

const Login = props => {
  document.title = "Login | PGA Gestão de Piscinas"

  const dispatch = useDispatch();

  const validation = useFormik({
    // enableReinitialize : use this  flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().required("Informe seu email"),
      password: Yup.string().required("Informe sua senha"),
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


  return (
    <React.Fragment>
      <div
        style={{
          minHeight: "100vh",
          backgroundImage:
            `linear-gradient(135deg, rgba(0,0,0,0.35), rgba(0,0,0,0.6)), url(${poolImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Container fluid className="p-0 d-flex align-items-stretch" style={{ minHeight: "100vh" }}>
          <Row className="g-0 flex-grow-1 justify-content-end align-items-stretch">
            <Col
              md={6}
              lg={5}
              xl={4}
              className="d-flex justify-content-end align-items-stretch"
              style={{ maxWidth: 460 }}
            >
              <Card
                className="overflow-hidden shadow-lg w-100 border-0 d-flex"
                style={{
                  minHeight: "100vh",
                  borderRadius: 0,
                  backgroundColor: "#fff",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
              >
                <CardBody className="pt-0 d-flex flex-column justify-content-center h-100">
                  <div className="px-3 flex-grow-1 d-flex flex-column justify-content-center">
                    <div className="text-center mb-3">
                      <Link to="/" className="d-block auth-logo">
                        <img src={pgaLogo} alt="PGA" height="180" />
                      </Link>
                    </div>

                    <h4 className="text-muted font-size-18 mb-1 text-center">PGA Gestão de Piscinas</h4>
                    <p className="text-muted text-center">Faça login para continuar.</p>
                    <Form
                      className="form-horizontal mt-4"
                      onSubmit={e => {
                        e.preventDefault()
                        validation.handleSubmit()
                        return false
                      }}
                    >
                      {error ? (
                        <Alert color="danger" fade={false}>
                          {typeof error === "string" ? error : String(error)}
                        </Alert>
                      ) : null}
                      <div className="mb-3">
                        <Label htmlFor="username">Email</Label>
                        <Input
                          id="username"
                          name="email"
                          className="form-control"
                          placeholder="Digite seu email"
                          type="email"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.email || ""}
                          invalid={validation.touched.email && validation.errors.email ? true : false}
                        />
                        {validation.touched.email && validation.errors.email ? (
                          <FormFeedback type="invalid">{validation.errors.email}</FormFeedback>
                        ) : null}
                      </div>
                      <div className="mb-3">
                        <Label htmlFor="userpassword">Senha</Label>
                        <Input
                          id="userpassword"
                          name="password"
                          value={validation.values.password || ""}
                          type="password"
                          placeholder="Digite sua senha"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          invalid={validation.touched.password && validation.errors.password ? true : false}
                        />
                        {validation.touched.password && validation.errors.password ? (
                          <FormFeedback type="invalid">{validation.errors.password}</FormFeedback>
                        ) : null}
                      </div>
                      <Row className="mb-3 mt-4">
                        <div className="col-6">
                          <div className="form-check">
                            <input type="checkbox" className="form-check-input" id="customControlInline" />
                            <label className="form-check-label" htmlFor="customControlInline">
                              Lembrar-me
                            </label>
                          </div>
                        </div>
                        <div className="col-6 text-end">
                          <button className="btn btn-primary w-md waves-effect waves-light" type="submit">
                            Entrar
                          </button>
                        </div>
                      </Row>
                      <Row className="form-group mb-0">
                        <div className="col-12 mt-4">
                          <Link to="/forgot-password" className="text-muted">
                            <i className="mdi mdi-lock"></i> Esqueceu sua senha?
                          </Link>
                        </div>
                      </Row>
                    </Form>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  )
}

export default withRouter(Login);
