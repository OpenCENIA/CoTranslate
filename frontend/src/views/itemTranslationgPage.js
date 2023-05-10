import { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';

import {
  Form,
  FormGroup,
  Input,
  Label,
  Button
} from "reactstrap";

const ItemTranslationgPage = (props) => {
  const { count, setCount, content } = props;

  // const authToken = localStorage.getItem("authTokens") ? JSON.parse(localStorage.getItem("authTokens")) : null
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const campaign = localStorage.getItem("campaign")
      ? JSON.parse(localStorage.getItem("campaign"))
      : null;  

  const [campaignItem, setCampaignItem] = useState({
    originalItem: '',
    translatedItem: '',
    comments: '',
    status: 'undefined',
    campaign: '',
    assignedTranslator: '',
    assignedTagger: '',
  });

  const [activeAnswer, setActiveAnswer] = useState({
    profile: user ? user.profile.id : -1,
    campaign: '',
    campaignItem: campaignItem,
    translationQuality: 0,
    type: 'translation',
    status: 'translating',
    comment: '',
    translation: '',
    answerTime: count,
  })


  // variables to check the translation returned by the http request to get_latest_answer
  const [latestTranslation, setLatestTranslation] = useState("")
  const [translationType, setTranslationType] = useState("")

  // console.log(latestTranslation)
  // console.log(translationType)

  const handleChange = (e) => {
    let newActiveAnswer = {...activeAnswer};
    
    newActiveAnswer.campaignItem = campaignItem.id;
    newActiveAnswer.campaign = campaign.id;
    newActiveAnswer.translation = e.target.value
    newActiveAnswer.answerTime = count;

    setActiveAnswer(newActiveAnswer)
  }

  function updateItem(item) {
    axios
      .put(`/api/campaign_items/${campaignItem.id}/update_item/`, {status: 'translating'})
      .then((res) => console.log(res))
      .catch((err) => console.log(err));
  }

  function handleSend(item) {
    if (item.id) {
      axios
        .put(`/api/campaign_items_answer/${item.id}/`, item)
        .then((res) => {
          // console.log(res)
          updateItem(item)
        })
        .catch((err) => console.log(err));
    } else {
      axios
        .put("/api/campaign_items_answer/new_answer/", item)
        .then((res) => {
          // console.log(res)
          updateItem(item)
        })
        .catch((err) => console.log(err));
    }

    setCount(0);  
    navigate("/campaign")
  }

  // trigger on component mount
  useEffect(() => {
    setCount(0);  
    if (user) {
      if (user.role === 'Manager') {
        navigate("/manager")
      } else {
        if (campaign && typeof campaign !== 'undefined') {

          axios
            .post("/api/campaign_items/get_item/", {userTest: user, campaignId: campaign.id, type: 'translate'})
            .then((res) => {
              // console.log(res.data)
              if (res.data[0].status !== 'Error') {
                setCampaignItem(res.data[0]);

                // get the latest translation in order to display it with the comments
                axios
                  .put("/api/campaign_items_answer/get_latest_answer/", {campaignItem: res.data[0], type: 'validate'})
                  .then((res2) => {
                    // console.log(res2.data)
                    setLatestTranslation(res2.data.translation);
                    setTranslationType(res2.data.status);
                  })
                  .catch((err) => console.log(err));
              }
              if (res.data[0].status === 'editing') {
                axios
                  .put("/api/campaign_items_answer/get_answer/", {user: user.profile.id, campaignItem: res.data[0].id})
                  .then((res2) => {
                    setActiveAnswer(res2.data[0])
                    setCount(res2.data[0].answerTime)
                    
                  })
                  .catch((err) => console.log(err));
              }
            })
            .catch((err) => console.log(err));

        } else {
          navigate("/tagger")
        }

      }
    } else {
      navigate("/login")
    }

  }, [navigate, user, setCount]);

  // trigger when translationType changes (basically when the trigger on mount does a succesfull api call) 
  useEffect(() => {

    if (translationType !== "") {

      const id = setInterval(() => setCount((oldCount) => {
        // setCount(oldCount + 1)
        return (oldCount + 1)
      }), 1000);
      return () => {
        clearInterval(id);
      };

    }

  }, [translationType]);

  if (user && campaign && typeof campaign !== 'undefined') { 
    return (
      <Container fluid>
        <h1 className="text-uppercase text-center my-4">{campaign != null ? content.campaignTitle + ': ' + campaign.title : content.campaignTitleAlt}</h1>
        <Row style={styles.Row}>
          <Col md={10} sm={11} style={styles.Col}>
            { typeof campaignItem === 'undefined' || campaignItem.status === 'undefined' ? (
                <Card style={{...styles.Card, alignItems: 'center'}}>
                  <Card.Body>{content.noAvailableItemsMsg}</Card.Body>
                </Card>
              ) : (
                <Card style={styles.Card}>
                  <Card.Body>
                    <Card.Title>{content.translateTitle + campaign.originalLanguage}:</Card.Title> 
                    <Card.Text>{campaignItem.originalItem}</Card.Text>
                  </Card.Body>
                  {/* {
                    typeof campaignItem !== 'undefined'  && ( */}
                  <Card.Body>
                    <Card.Title>{content.commentTitle}:</Card.Title> 
                    {translationType === "latest" && (
                      <Card.Text>{content.commentRejectedTrans + latestTranslation}</Card.Text>
                    )}
                    {campaignItem.comments.split('||\n||').map((comment, id) => {
                      if (translationType === "latest") {
                        return (
                          <Card.Text key={"comment" + comment + id}>{content.commentRejectedReasons + (parseInt(id) + 1).toString() + ": " + comment}</Card.Text>
                        )
                      } else {
                        return (
                          <Card.Text key={"comment" + comment + id}>{comment}</Card.Text>
                        )
                      }

                    })}
                  </Card.Body>
                    {/* )
                  } */}
                  <Form style={styles.Form}>
                    <FormGroup check>
                      <Label check for="translation">{content.translateInstruction + campaign.targetLanguage}:</Label>
                      <Input type="textarea" name="translation" placeholder={content.translatePlaceholder} value={activeAnswer.translation} onChange={handleChange} />
                    </FormGroup>
                  </Form>
                  <Button
                    color="success"
                    onClick={() => handleSend(activeAnswer)}
                    style={styles.Button}
                  >
                    {content.translateButton}
                  </Button>
                </Card>
              )
            }
          </Col>
        </Row>
      </Container>
    );
  }
  return (<></>)
};

export default ItemTranslationgPage;

const styles = {
  Row: {
    justifyContent: "center",
    margin: "auto",
  },
  Col: {
    margin: "auto",
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
