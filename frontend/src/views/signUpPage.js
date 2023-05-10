import { useState, useContext, useEffect } from "react";
import AuthContext from "../context/AuthContext";

import axios from "axios";

import Container from 'react-bootstrap/Container';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';

function SignUp(props) {
  const {content} = props;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const roleList = [content.roleDefault, content.roleTagger, content.roleManager];
  const [role, setRole] = useState(0);
  const [userSkills, setUserSkills] = useState([]);

  const [skillList, setSkillList] = useState([]);
  const { registerUser } = useContext(AuthContext);

  const onSelectRole = (e) => {
    setRole(parseInt(e))
  };

  const onChangeCheckedSkills = (e) => {
    let id = typeof e.target.htmlFor !== 'undefined' ? e.target.htmlFor : e.target.id;
    let newUserSkills = [...userSkills];
    const index = newUserSkills.indexOf(parseInt(id));

    if (newUserSkills.includes(parseInt(id)) !== true) {
      if (index < 0) { 
        newUserSkills.push(parseInt(id));
      }
    } else {
      if (index > -1) { // only splice array when item is found
        newUserSkills.splice(index, 1); // 2nd parameter means remove one item only
      }
    }
    newUserSkills.sort();
    setUserSkills(newUserSkills);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    registerUser(username, password, password2, role, userSkills);
  };

  // trigger on component mount
  useEffect(() => {
    axios
      .get("/api/skills/")
      .then((res) => setSkillList(res.data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <Container fluid>
      <h1 className="text-center my-4">{content.signUp}</h1>
      <Row style={styles.Row}>
        <Col md={10} sm={11} style={styles.Col}>
          <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>{content.username}</Form.Label>
            <Form.Control onChange={e => setUsername(e.target.value)} type="username" name="username" placeholder={content.usernamePlaceholder} />
          </Form.Group>
          <p style={{color: 'red'}}>{username === "" ? content.usernameWarning : ""}</p>

          <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Label>{content.password}</Form.Label>
            <Form.Control type="password" onChange={e => setPassword(e.target.value)} name="password" placeholder={content.passwordPlaceholder} />
          </Form.Group>
      
          <Form.Group className="mb-3" controlId="formBasicConfirmPassword">
            <Form.Label>{content.password2}</Form.Label>
            <Form.Control type="password" onChange={e => setPassword2(e.target.value)} name="password2" placeholder={content.password2Placeholder} />
          </Form.Group>
          <p style={{color: 'red'}}>{password2 !== password ? content.passwordWarning : ""}</p>


          <Form.Group className={role === 2 ? "mb-5" : "mb-3"}>
            <Form.Label>{content.roleTitle}</Form.Label>
            <DropdownButton
              title={roleList[role]}
              onSelect={onSelectRole}
              value={"default"}
            >
              <Dropdown.Item eventKey={1}>{content.roleTagger}</Dropdown.Item>
              <Dropdown.Item eventKey={2}>{content.roleManager}</Dropdown.Item>
            </DropdownButton>
          </Form.Group>
          <p style={{color: 'red'}}>{role === 0 ? content.roleWarning : ""}</p>

          <Button variant="primary" type="submit" disabled={username === "" || password2 !== password || role === 0}>
            Sign up
          </Button>
        </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default SignUp;

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
  },  
  SelectedItem: {
    marginLeft: 1,
    marginRight: 1,
  }
};
