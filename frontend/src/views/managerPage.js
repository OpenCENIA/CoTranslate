import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

import ModalReview from "../components/ModalReview";
import ModalCreateEditCampaign from "../components/ModalCreateEditCampaign";
import axios from "axios";

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';

import ModalDeleteConfirmation from "../components/ModalDeleteConfirmation";
import AuthContext from "../context/AuthContext";

const ManagerPage = (props) => {
  const { content, appLang } = props;
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [viewCompleted, setViewCompleted] = useState(false);
  const [modalCreateEdit, setModalCreateEdit] = useState(false);
  const [createNewCampaign, setCreateNewCampaign] = useState(false);

  const [modalReview, setModalReview] = useState(false);
  const [modalDelete, setModalDelete] = useState(false);
  
  const [deleteCampaign, setDeleteCampaign] = useState(undefined);

  const [activeCampaign, setActiveCampaign] = useState({
    id: "",
    title: "",
    owner: user && typeof user !== 'undefined' ? user.profile.id : -1,
    description: "",
    completed: false,
    isNllb: false,
    campaignType: 0,
    originalLanguage: "",
    targetLanguage: "",
    requiredSkills: [],
    assignedTranslators: [],
    assignedTaggers: [],
    taggersPerValidation: 1,
    validationThreshold: 50,
  });
  const [activeCampaignAnswers, setActiveCampaignAnswers] = useState([
    {
      tagger: "",
      campaignItem: "",
      translationQuality: "",
      taggerComment: "",
      taggerTranslation: "",
      answerTime: 0,
    }
  ])
  const [activeCampaignItems, setActiveCampaignItems] = useState([]);
  const [campaignList, setCampaignList] = useState([]);
  const [skillList, setSkillList] = useState([]);
  const [profilesList, setProfilesList] = useState([]);


  const refreshList = () => {
    axios
    .get("/api/profiles/")
    .then((res) => setProfilesList(res.data))
    .catch((err) => console.log(err));

    axios
      .get("/api/skills/")
      .then((res) => setSkillList(res.data))
      .catch((err) => console.log(err));

    axios
      .get("/api/campaigns/")
      .then((res) => setCampaignList(res.data))
      .catch((err) => console.log(err));
  };

  const toggleCreateEdit = () => {
    setModalCreateEdit(!modalCreateEdit);
  };

  const toggleReview = () => {
    setModalReview(!modalReview);
  };

  const handleSubmit = (campaign, campaignDataset) => {
    if (campaign.owner === -1) {
      return
    }

    toggleCreateEdit();
    let campaignDatasetForm = new FormData();

    for (var key in campaignDataset ) {
      campaignDatasetForm.append(key, campaignDataset[key]);
    }
    if (campaign.id) {
      axios
        .put(`/api/campaigns/${campaign.id}/`, campaign)
        .then((res) => refreshList());      
      return;
    }
    axios
      .put("/api/campaigns/new_campaign/", campaign)
      .then((res) => {
        axios
        .put(`/api/campaigns/${res.data.newCampaignPK}/upload_dataset/`, campaignDatasetForm)
        .then((res) => refreshList());
      });
  };

  const handleDelete = (campaign) => {
    setModalDelete(!modalDelete);
    setDeleteCampaign(campaign);
  };

  const createCampaign = () => {
    setCreateNewCampaign(true);
    const campaign = {
      id: "",
      owner: typeof user !== 'undefined' ? user.profile.id : -1,
      title: "",
      description: "",
      completed: false,
      isNllb: true,
      campaignType: 1,
      originalLanguage: "",
      targetLanguage: "",  
      requiredSkills: [],
      assignedTranslators: [],
      assignedTaggers: [],
      taggersPerValidation: 1,
      validationThreshold: 50,
    };

    setActiveCampaign(campaign);
    setModalCreateEdit(!modalCreateEdit);
  };

  const editCampaign = (campaign) => {
    setCreateNewCampaign(false);
    setActiveCampaign(campaign);
    setModalCreateEdit(!modalCreateEdit);
  };

  const reviewCampaign = (campaign) => {
    axios
    .post("/api/campaign_items_answer/get_campaign_item_answers/", {campaign: campaign})
    .then((res) => {
      console.log(res);
      setActiveCampaign(campaign);
      setActiveCampaignAnswers(res.data);
 
      axios
      .post("/api/campaign_items/get_campaign_items/", {campaign: campaign})
      .then((res) => {
        setActiveCampaignItems(res.data)
        setModalReview(!modalReview);
      })
      .catch((err) => console.log(err));

    })
    .catch((err) => console.log(err));
  };

  const displayCompleted = (status) => {
    if (status) {
      setViewCompleted(true);
      return;
    }
    setViewCompleted(false);
  };

  const renderTabList = () => {
    return (
      <div className="nav nav-tabs">
        <span
          className={viewCompleted ? "nav-link active" : "nav-link"}
          onClick={() => displayCompleted(true)}
        >
          {content.tabComplete}
        </span>
        <span
          className={viewCompleted ? "nav-link" : "nav-link active"}
          onClick={() => displayCompleted(false)}
        >
          {content.tabInProgress}
        </span>
      </div>
    );
  };

  const renderCampaigns = () => {
    const visibleCampaigns = campaignList.filter(
      (campaign) => campaign.completed === viewCompleted
    );

    return visibleCampaigns.map((campaign) => {
      
      if (campaign.owner === user.profile.id) {
        return (
          <Container fluid key={campaign.title + "map-campaigns" + campaign.description + campaign.completed + campaign.id}>
            <Row style={styles.Row}>
              <Col xs={8}>{campaign.title}</Col>
              <Col xs={4} style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', flexWrap: 'wrap'}}>
                <Button
                  variant="primary"
                  onClick={() => reviewCampaign(campaign)}
                >
                  {content.reviewButton}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => editCampaign(campaign)}
                >
                  {content.editButton}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(campaign)}
                >
                  {content.deleteButton}
                </Button>
              </Col>
            </Row>
          </Container>
        );
      }
      return (<div key={campaign.title + "map-campaigns-not-used" + campaign.description + campaign.completed + campaign.id}></div>)
    })
  }

  // trigger on component mount
  useEffect(() => {
    if (user) {
      if (user.role === 'Tagger') {
        navigate("/tagger")
      } else {
        refreshList();
      }
    } else {
      navigate("/login")
    }
    
  }, [navigate, user]);

  if (user) {
    return (
      <Container fluid>
        <h1 className="text-center my-4">{content.welcome1 + user.username + "!" + content.welcome2}</h1>
        <Row>
          <Col md={9} sm={10} style={styles.Col}>
            <Card style={styles.Card}>
              <Row style={styles.AddButton}>
                <Col>
                  <Button variant="primary" onClick={createCampaign}>
                    {content.addCampaignButton}
                  </Button>
                </Col>
              </Row>
              {renderTabList()}
              <ul className="list-group list-group-flush border-top-0">
                {renderCampaigns()}
              </ul>
            </Card>
          </Col>
        </Row>
        {modalCreateEdit ? (
          <ModalCreateEditCampaign
            modal={modalCreateEdit}
            setModal={setModalCreateEdit}
            createNewCampaign={createNewCampaign}
            activeCampaign={activeCampaign}
            skillList={skillList}
            profilesList={profilesList}
            toggle={toggleCreateEdit}
            handleSubmit={handleSubmit}
            content={appLang.modalCreateEditCampaign}
          />
        ) : null}
        {modalReview ? (
          <ModalReview
            modalReview={modalReview}
            setModalReview={setModalReview}
            activeCampaign={activeCampaign}
            activeCampaignItems={activeCampaignItems}
            activeCampaignAnswers={activeCampaignAnswers}
            profilesList={profilesList.filter(profile => activeCampaign.assignedTranslators.includes(profile.id) || activeCampaign.assignedTaggers.includes(profile.id))}
            toggle={toggleReview}
            content={appLang.modalReview}
          />
        ) : null}
        {modalDelete ? (
          <ModalDeleteConfirmation
            setModalDelete={setModalDelete}
            refreshList={refreshList}
            modalDelete={modalDelete}
            deleteItem={deleteCampaign}
            content={appLang.modalDeleteConfirmation}
          />
        ) : null}
      </Container>
    );
  }
  return (<></>);
};

export default ManagerPage;

const styles = {
  Row: {
    justifyContent: "center",
    margin: 5,
  },
  Col: {
    margin: "auto",
  },
  Card: {
    margin: "auto",
    padding: "2%",
  },
  AddButton: {
    marginBottom: "2%",
  },
}
