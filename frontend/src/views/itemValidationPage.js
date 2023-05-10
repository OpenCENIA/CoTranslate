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

const ItemTaggingPage = (props) => {
  const { count, setCount, content } = props;

  // const authToken = localStorage.getItem("authTokens") ? JSON.parse(localStorage.getItem("authTokens")) : null
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const campaign = localStorage.getItem("campaign")
      ? JSON.parse(localStorage.getItem("campaign"))
      : null;  

  const [translation, setTranslation] = useState(null);

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
    translation: '',
    translationQuality: 0,
    type: 'validation',
    status: 'validating',
    comment: '',
    answerTime: count,
  })

  const handleChange = (e) => {
    let newActiveAnswer = {...activeAnswer};

    newActiveAnswer.campaignItem = campaignItem.id;
    newActiveAnswer.campaign = campaign.id;

    newActiveAnswer.translation = translation ? translation : "";
  
    if (e.target.name === 'translationQuality') {
      newActiveAnswer.translationQuality = parseInt(e.target.value);
    }
    if (e.target.name === 'comment') {
      newActiveAnswer.comment = e.target.value;
    }
    newActiveAnswer.answerTime = count;

    setActiveAnswer(newActiveAnswer)
  }

  function handleSend(item) {
    axios
      .put("/api/campaign_items_answer/new_answer/", item)
      .then((res) => {
        // console.log(res)
        
        axios
          .put(`/api/campaign_items/${campaignItem.id}/update_item/`, {status: 'validating'})
          .then((res2) => console.log(res2))
          .catch((err2) => console.log(err2));

      })
      .catch((err) => console.log(err));

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
            .post("/api/campaign_items/get_item/", {userTest: user, campaignId: campaign.id, type: 'validate'})
            .then((res) => {
              // console.log(res.data)
              if(res.data[0].status !== 'Error') {
                setCampaignItem(res.data[0]);
                axios
                  .put("/api/campaign_items_answer/get_latest_answer/", {campaignItem: res.data[0], type: 'validate'})
                  .then((res2) => {
                    // console.log(res2.data)
                    setTranslation(res2.data.translation);
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

  // trigger when translation changes from null to string (basically when the trigger on mount does a succesfull api call) 
  useEffect(() => {

    if (translation) {

      const id = setInterval(() => setCount((oldCount) => {
        // setCount(oldCount + 1)
        return (oldCount + 1)
      }), 1000);
      return () => {
        clearInterval(id);
      };

    }

  }, [translation]);


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
                    <Card.Title>{content.validateTitle}</Card.Title> 
                    
                    <Card.Title>{content.validateOriginal + campaign.originalLanguage}:</Card.Title>
                    <Card.Text>{campaignItem.originalItem}</Card.Text>

                    <Card.Title>{content.validateTranslated + campaign.targetLanguage}:</Card.Title>
                    <Card.Text>{translation ? translation : ""}</Card.Text>
                  </Card.Body>
                    <Form style={styles.Form}>
                      <FormGroup check>
                        <Label check for="campaign-form-title">{content.validateInstruction}</Label>
                        <Input
                          type="select"
                          name="translationQuality"
                          id="campaign-item-radial"
                          value={activeAnswer.translationQuality}
                          onChange={handleChange}
                        >
                          <option disabled value={0}>----</option>
                          <option value={1}>{content.validateYes}</option>
                          <option value={2}>{content.validateNo}</option>
                        </Input>
                      </FormGroup>
                      <FormGroup check>
                        <Label check for="comment">{content.commentTitle}</Label>
                        <Input type="textarea" name="comment" placeholder={content.commentPlaceholder} value={activeAnswer.comment} onChange={handleChange} />
                      </FormGroup>
                    </Form>

                    <Button
                      color="success"
                      onClick={() => handleSend(activeAnswer)}
                      style={styles.Button}
                    >
                      {content.validateButton}
                    </Button>
                </Card>
              )
            }
          </Col>
        </Row>
      </Container>
    );
  }

  return (<></>);
};

export default ItemTaggingPage;

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
