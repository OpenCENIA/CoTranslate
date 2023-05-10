import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';

import AuthContext from "../context/AuthContext";
// import { Link } from "react-router-dom";
import axios from "axios";

const TaggerPage = (props) => {
  const { content } = props;

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const campaign = localStorage.getItem("campaign")
      ? JSON.parse(localStorage.getItem("campaign"))
      : null;  

  const [answeredItems, setAnsweredItems] = useState([]);
  const [campaignItems, setCampaignItems] = useState([]);

  const goToTranslate = () => {
    navigate("translate")
  }

  const goToTag = () => {
    navigate("validate")
  }

  const editAnswer = (answer) => {
    axios
    .put("/api/campaign_items_answer/edit_answer/", {answer: answer})
    .then((res) => {
      if (res.data.status === 'Error') {
        console.log("Can't edit answer that are already validated. Please refresh the page");
      } else {
        console.log("Now you can edit your previous translation");
        goToTranslate();
      }
    })
    .catch((err) => console.log(err));
  }

  // trigger on component mount
  useEffect(() => {
    if (user) {
      if (user.role === 'Manager') {
        navigate("/manager")
      } else {
        if (campaign) {
          axios
            .put("/api/campaign_items_answer/get_user_answers/", {userTest: user, campaign: campaign})
            .then((res) => {
              if (res.data.status !== 'Error') {
                setAnsweredItems(res.data);
              }
            })
          .catch((err) => console.log(err));
      
          axios
            .post("/api/campaign_items/get_campaign_items/", {campaign: campaign})
            .then((res) => {
              setCampaignItems(res.data)
            })
            .catch((err) => console.log(err));
        } else {
          navigate("/tagger")
        }

      }
    } else {
      navigate("/login")
    }

  }, [navigate, user]);

  if (user && campaign) {
    return (
      <Container fluid>
        <h1 className="text-center my-4">{content.campaignTitle}: {campaign.title}</h1>
        <Row style={styles.Row}>
          <Col md={10} sm={11} style={styles.Col}>
            <Card>

              <Card.Body>
                <Card.Title>{content.campaignRule}:</Card.Title>
                <Card.Text>{campaign.description}</Card.Text>
                <Card.Title>{content.campaignOptions}:</Card.Title>
                <Container style={styles.ButtonContainer}>
                {campaign.assignedTranslators.includes(user.user_id) && (
                      <Button
                        variant="primary"
                        onClick={goToTranslate}
                        style={styles.Button}
                      >
                        {content.translateButton}
                      </Button>

                )}
                {campaign.assignedTaggers.includes(user.user_id) && (
                  <Button
                        variant="primary"
                        onClick={goToTag}
                        style={styles.Button}
                      >
                        {content.validateButton}
                      </Button>
                )}
                  </Container>
              </Card.Body>
              
              {answeredItems.length > 0 &&
              campaignItems.length > 0 &&
              answeredItems.filter((answer) => {return(answer.type === 'translation')}).length > 0 && (
                <Container style={styles.TableContainer}>
                  <Table style={styles.Table}>
                    <thead>
                      <tr>
                        <th className="text-center" colSpan="2">{content.translateTitle}: {answeredItems.filter((answer) => {return(answer.type === 'translation')}).length}</th>
                      </tr>
                      {answeredItems.filter((answer) => {return(answer.type === 'translation')}).map((answer, id) => {
                        let item = campaignItems.filter(i => parseInt(i.id) === parseInt(answer.campaignItem))[0];
                        let editable = item.assignedTagger.length === 0 && item.assignedTranslator === user.profile.id && item.status !== 'editing';

                        return (
                          <tr key={answer + id + "editbutton"} style={{width: "50%"}}>
                            <td className="text-end" style={{width: "50%"}}>{item.id}</td>
                            <td className="text-start" style={{width: "50%"}}>
                              {editable ? (
                                <Button onClick={() => editAnswer(answer)} variant="primary">{content.editButton}</Button>
                              ) : (
                                item.status === 'editing' ? (
                                  <Button disabled variant="primary">{content.editingButton}</Button>
                                ) : (
                                  <></>
                                )
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </thead>
                  </Table>
                </Container>
              )}
              
              {answeredItems.length > 0 &&
              campaignItems.length > 0 &&
              answeredItems.filter((answer) => {return(answer.type === 'validation')}).length > 0 && (
                <Container style={styles.TableContainer}>
                  <Table style={styles.Table}>
                    <thead>
                      <tr>
                        <th className="text-center" colSpan="2">{content.validateTitle}: {answeredItems.filter((answer) => {return(answer.type === 'validation')}).length}</th>
                      </tr>
                      {answeredItems.filter((answer) => {return(answer.type === 'validation')}).map((answer, id) => {
                        let item = campaignItems.filter(i => parseInt(i.id) === parseInt(answer.campaignItem))[0];
                        // let editable = item.assignedTagger.length === 0 && item.assignedTranslator === user.profile.id && item.status !== 'editing';

                        return (
                          <tr key={answer + id + "editvalidationbutton"} style={{width: "50%"}}>
                            <td className="text-end" style={{width: "50%"}}>{item.id}</td>
                            <td className="text-start" style={{width: "50%"}}>
                            </td>
                          </tr>
                        )
                      })}
                    </thead>
                  </Table>
                </Container>
              )}
              
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
  return(<></>)
};

export default TaggerPage;

const styles = {
  Row: {
    justifyContent: "center",
    margin: "auto",
    padding: 10,
  },
  Col: {
    margin: "auto",
  },
  ButtonContainer: {
    marginBottom: 2,
    display: 'flex', 
    alignItems: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap', 
  },
  Button: {
    margin: 5,
    marginLeft: 0,
  },
  TableContainer: {
    padding: 10,
    display: 'flex',
    justifyContent: 'center',
  },
  Table: {
    width: "70%",
  },
};
