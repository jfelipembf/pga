import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Alert, Card, CardBody, Col, Container, FormFeedback, Input, Label, Row } from "reactstrap";
import pgaLogo from "../../assets/images/pgaLogo.png";
import poolImg from "../../assets/images/pool.jpg";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";
import withRouter from "components/Common/withRouter";
// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

// action
import { userForgetPassword } from "../../store/actions";

const ForgetPasswordPage = props => {
  document.title = "Recuperar senha | PGA Gestão de Piscinas";

  const dispatch = useDispatch();

  const validation = useFormik({
    // enableReinitialize : use this flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      email: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().required("Informe seu email"),
    }),
    onSubmit: values => {
      dispatch(userForgetPassword(values, props.history));
    },
  });


  const selectForgotPasswordState = (state) => state.ForgetPassword;
  const ForgotPasswordProperties = createSelector(
    selectForgotPasswordState,
    (forgetPassword) => ({
      forgetError: forgetPassword.forgetError,
      forgetSuccessMsg: forgetPassword.forgetSuccessMsg,
    })
  );

  const { forgetError, forgetSuccessMsg } = useSelector(ForgotPasswordProperties);

  return (
    <React.Fragment>
      <div
        style={{
          minHeight: "100vh",
          backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.35), rgba(0,0,0,0.6)), url(${poolImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Container fluid className="d-flex align-items-stretch" style={{ minHeight: "100vh" }}>
          <Row className="flex-grow-1 justify-content-end align-items-stretch">
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
                        <img src={pgaLogo} alt="PGA" height="120" />
                      </Link>
                    </div>

                    <h4 className="text-muted font-size-18 mb-1 text-center">Redefinir senha</h4>
                    <p className="text-muted text-center">
                      Informe seu e-mail para receber o link de recuperação.
                    </p>
                    {forgetError ? (
                      <Alert color="danger" style={{ marginTop: "13px" }} fade={false}>
                        {forgetError}
                      </Alert>
                    ) : null}
                    {forgetSuccessMsg ? (
                      <Alert color="success" style={{ marginTop: "13px" }} fade={false}>
                        {forgetSuccessMsg}
                      </Alert>
                    ) : null}

                    <form
                      className="form-horizontal mt-4"
                      onSubmit={e => {
                        e.preventDefault();
                        validation.handleSubmit();
                        return false;
                      }}
                    >
                      <div className="mb-3">
                        <Label htmlFor="useremail">Email</Label>
                        <Input
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

                      <Row className="mb-3">
                        <div className="col-12 text-end">
                          <button className="btn btn-primary w-md waves-effect waves-light" type="submit">
                            Enviar
                          </button>
                        </div>
                      </Row>
                    </form>

                    <div className="text-center mt-3">
                      <span className="text-muted">Lembrou a senha? </span>
                      <Link to="/login" className="text-primary">
                        Entrar
                      </Link>
                    </div>
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

ForgetPasswordPage.propTypes = {
  history: PropTypes.object,
};

export default withRouter(ForgetPasswordPage);
