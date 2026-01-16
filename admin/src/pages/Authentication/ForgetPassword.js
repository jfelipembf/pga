import React from 'react'
import PropTypes from "prop-types";
import { Link } from 'react-router-dom';
import { Alert, Card, CardBody, Col, Container, FormFeedback, Input, Label, Row } from 'reactstrap';
import logoDark from "../../assets/images/logo-dark.png";
import logoLight from "../../assets/images/logo-light.png";
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from "reselect";
import withRouter from 'components/Common/withRouter';
// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

// action
import { userForgetPassword } from "../../store/actions";

const ForgetPasswordPage = props => {
  document.title = "Forget Password | Lexa - Responsive Bootstrap 5 Admin Dashboard";

  const dispatch = useDispatch();

  const validation = useFormik({
    // enableReinitialize : use this flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      email: '',
    },
    validationSchema: Yup.object({
      email: Yup.string().required("Por favor, insira seu e-mail"),
    }),
    onSubmit: (values) => {
      dispatch(userForgetPassword(values, props.history));
    }
  });


  const selectForgotPasswordState = (state) => state.ForgetPassword;
  const ForgotPasswordProperties = createSelector(
    selectForgotPasswordState,
    (forgetPassword) => ({
      forgetError: forgetPassword.forgetError,
      forgetSuccessMsg: forgetPassword.forgetSuccessMsg,
    })
  );

  const {
    forgetError,
    forgetSuccessMsg
  } = useSelector(ForgotPasswordProperties);

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
                    <h4 className="text-muted font-size-18 mb-3 text-center">Redefinir Senha</h4>
                    {forgetError && forgetError ? (
                      <Alert color="danger" style={{ marginTop: "13px" }}>
                        {forgetError}
                      </Alert>
                    ) : null}
                    {forgetSuccessMsg ? (
                      <Alert color="success" style={{ marginTop: "13px" }}>
                        {forgetSuccessMsg}
                      </Alert>
                    ) : null}
                    <form className="form-horizontal mt-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        validation.handleSubmit();
                        return false;
                      }}>

                      <div className="mb-3">
                        <Label htmlFor="useremail">E-mail</Label>
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

                      <Row className="mb-3">
                        <div className="col-12 text-end">
                          <button className="btn btn-primary w-md waves-effect waves-light" type="submit">Redefinir</button>
                        </div>
                      </Row>
                    </form>
                  </div>
                </CardBody>
              </Card>
              <div className="mt-5 text-center">
                <p>Lembrou? <Link to="/login" className="text-primary"> Entrar aqui </Link> </p>
                © {new Date().getFullYear()} Painel Swim <span className="d-none d-sm-inline-block"> - Desenvolvido com <i className="mdi mdi-heart text-danger"></i> por Felipe Macedo.</span>
              </div>
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
