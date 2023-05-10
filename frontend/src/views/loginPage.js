import { useContext } from "react";
import AuthContext from "../context/AuthContext";

import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const LoginPage = (props) => {
  const { loginUser } = useContext(AuthContext);
  const { content } = props;

  const handleSubmit = e => {
    e.preventDefault();
    const formData = new FormData(e.target),
                      formDataObj = Object.fromEntries(formData.entries())
    formDataObj.username.length > 0 && loginUser(formDataObj.username, formDataObj.password);
  };

  return (
    <Container fluid>
      <h1 className="text-center my-4">{content.login}</h1>
      <Row style={styles.Row}>
        <Col md={10} sm={11} style={styles.Col}>
          <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>{content.username}</Form.Label>
            <Form.Control type="username" name="username" placeholder={content.usernamePlaceholder} />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Label>{content.password}</Form.Label>
            <Form.Control type="password" name="password" placeholder={content.passwordPlaceholder} />
          </Form.Group>
          <Button variant="primary" type="submit">
            {content.login}
          </Button>
        </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;

const styles = {
  Row: {
    justifyContent: "center",
    margin: "auto",
  },
  Col: {
    margin: "auto",
    padding: "1%",
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'black',
    borderRadius: 5,
  },
  Card: {
    paddingLeft: "3%",
    paddingRight: "3%",
    paddingBottom: "3%",
    paddingTop: "1%",
  },
  Form: {
    paddingTop: "2%",
    paddingRight: "4%"
  },
  Button: {
    margin: "auto",
    marginTop: "3%",
  }
}
