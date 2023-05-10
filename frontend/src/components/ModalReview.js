import React, { useState } from "react";
import {
  Table,
} from "reactstrap";

import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Modal from 'react-bootstrap/Modal';

const ModalReview = (props) => {
  const { 
    modalReview,
    setModalReview,
    activeCampaign,
    activeCampaignItems,
    activeCampaignAnswers,
    profilesList,
  } = props;


  const [dropdownFilterValue, setDropdownFilterValue] = useState("Campaign review")
  const translationQualityArr = ["Good translation", "Bad translation"];

	const handleClose = () => {
    setModalReview(false);
	}

  const handleSelectedFilterChange = (e) => {
    setDropdownFilterValue(e)
  }

  const getTableParams = (item) => {
    let row = []
    if (dropdownFilterValue === "Campaign review") {
      row = [
        activeCampaign.title,
        activeCampaign.description,
        activeCampaign.completed ? 'Closed' : 'In progress',
        activeCampaignItems.length,
        activeCampaignItems.filter(cItem => cItem.status === 'completed').length,
        activeCampaignItems.filter(cItem => cItem.status === 'validating').length,
        activeCampaignItems.filter(cItem => cItem.status === 'translating').length
      ];
    }

    if (dropdownFilterValue === "Items review") {
      let originalSentence = item.originalItem;
      let translatedSentence = item.translatedItem;
      let aproveScore = 0;
      let rejectScore = 0;
      let validationThreshold = activeCampaign.validationThreshold / 100;
      let status = item.status;

      let activeCampaignItemAnswers = activeCampaignAnswers.filter(answer => answer.campaignItem === item.id);
      let lastCycle = activeCampaignItemAnswers.length > 0 ? Math.max(...activeCampaignItemAnswers.map(v=>v.cycle)) : 0;

      if (lastCycle !== 0) {
        let lastCycleItemAnswers =  activeCampaignItemAnswers.filter(answer => answer.cycle === lastCycle);

        translatedSentence = lastCycleItemAnswers[0].translation;

        if (item.status === 'validating' || item.status === 'completed') {
            aproveScore = Math.round(lastCycleItemAnswers.filter(answer => answer.translationQuality === 1).length * 100 / activeCampaign.taggersPerValidation) / 100;
            rejectScore = Math.round(lastCycleItemAnswers.filter(answer => answer.translationQuality === 2).length * 100 / activeCampaign.taggersPerValidation) / 100;
          }
      }

      if (item.status === 'translating' || item.status === 'editing') {
        translatedSentence = '';
      }

      row = [item.id, originalSentence, translatedSentence, aproveScore, rejectScore, validationThreshold, status];
    }

    if (dropdownFilterValue === "Items progress") {
      let numberOfIterations = item.status !== 'translating' && activeCampaignAnswers.length > 0 ? Math.max(...activeCampaignAnswers.filter(answer => answer.campaignItem === item.id).map(v=>v.cycle)) : 0;
      
      let lastTranslator = '-';
      let lastTaggerGroup = "-";

      if (item.status !== 'translating') {
        lastTranslator = profilesList.filter(profile => profile.id === item.assignedTranslator);
        if (lastTranslator.length === 0) {
          lastTranslator = "-";
        } else {
          lastTranslator = lastTranslator[0].user;
        }

        lastTaggerGroup = profilesList.filter(profile => item.assignedTagger.includes(profile.id));
        if (lastTaggerGroup.length === 0) {
          lastTaggerGroup = "-";
        } else {
          lastTaggerGroup = lastTaggerGroup.map(tagger => tagger.user).join(', ');
        }

      } else {
        // TODO
      }

      row = [item.id, item.status, numberOfIterations, lastTranslator, lastTaggerGroup];
    }
    
    if (dropdownFilterValue === "Answers review") {
      let translationQuality = item.translationQuality;
      if (translationQuality === 0) {
        translationQuality = "-";
      } else {
        translationQuality = translationQualityArr[translationQuality - 1];
      }
      row = [
        item.campaignItem,
        item.cycle, 
        profilesList.filter(profile => profile.id === item.profile)[0].user,
        item.type === "translation" ? "Translator" : "Validator",
        item.translation,
        translationQuality,
        item.comment,
        item.answerTime,
      ];
    }
    
    if (dropdownFilterValue === "Taggers review") {
      let assignedRole = []
      if (activeCampaign.assignedTranslators.includes(item.id)) {
        assignedRole.push("Translator")
      }
      if (activeCampaign.assignedTaggers.includes(item.id)) {
        assignedRole.push("Validator")
      }
      let numberAssignedItems = activeCampaignItems.filter(cItem => cItem.assignedTranslator === item.id || cItem.assignedTagger.includes(item.id)).length;
      let numberTranslatedItems = activeCampaignAnswers.filter(cItem => cItem.type === 'translation' && cItem.profile === item.id).length;
      let numberValidatedItems = activeCampaignAnswers.filter(cItem => cItem.type === 'validation' && cItem.profile === item.id).length;
      let totalTimeEmployed = activeCampaignAnswers.filter(cItem => cItem.profile === item.id).map(answer => answer.answerTime).reduce((partialSum, a) => partialSum + a, 0);

      row = [
        item.user,
        assignedRole.join(", "),
        numberAssignedItems,
        numberTranslatedItems,
        numberValidatedItems,
        totalTimeEmployed,
      ];
    }

    return row
  }

  const handleDownloadCsv = () => {
    if (activeCampaignAnswers.length > 0) {
      let cols = [];
      let rows = [];

      if (dropdownFilterValue === "Campaign review") {
        cols = ["Name", "Description", "Status", "Number of items", "Items completed", "Items being validated", "Items being translated"]

        let campaignRows = getTableParams({})
        rows.push(campaignRows);
      }

      if (dropdownFilterValue === "Items review") {
        cols = ["Item", "Original sentence", "Translated sentence", "Aprove score", "Reject score", "Validation threshold", "Status"]
        rows = activeCampaignItems.map(item => {
          return (getTableParams(item))
        })
      }

      if (dropdownFilterValue === "Items progress") {
        cols = ["Item", "Status", "Iterations", "Last translator", "Last validator group"]
        rows = activeCampaignItems.map(item => {
          return (getTableParams(item))
        })
      }
      
      if (dropdownFilterValue === "Answers review") {
        cols = ["Item", "Iteration", "Tagger", "TaggerRole", "Translation", "TranslationQuality", "Comments", "AnswerTime(s)"]

        rows = activeCampaignAnswers.map(answer => {
          return (getTableParams(answer))
        })
      }
      
      if (dropdownFilterValue === "Taggers review") {
        cols = ["Name", "Role", "Amount of assigned items", "Amount of translated items", "Amount of validated items", "Total employed time (s)"]

        rows = profilesList.map(profile => {
          return (getTableParams(profile))
        })
      }
      if (cols.length > 0 && rows.length > 0) {
        let csvContent = "data:text/tsv;charset=utf-8," 
        + (cols.join("\t") + "\n").replaceAll("#", "%23")
        + rows.map(e => e.join("\t")).join("\n").replaceAll("#", "%23");

        var encodedUri = encodeURI(csvContent);
        var downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", encodedUri);
        downloadAnchorNode.setAttribute("download", "test.tsv");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
      }
    }
  }

  return (
    <Modal size="xl" show={modalReview} onHide={handleClose}>
      <Modal.Header>Campaign Items Review</Modal.Header>

      {/* Review dropdown selector */}
      <Modal.Header>
        <DropdownButton
          align={{ lg: 'start' }}
          title={dropdownFilterValue}
          id="dropdown-menu-align-responsive-1"
          onSelect={handleSelectedFilterChange}
          value={"default"}
        >
          <Dropdown.Item eventKey="Campaign review">Campaign review</Dropdown.Item>
          <Dropdown.Item eventKey="Items review">Items review</Dropdown.Item>
          <Dropdown.Item eventKey="Items progress">Items progress</Dropdown.Item>
          <Dropdown.Item eventKey="Answers review">Answers review</Dropdown.Item>
          <Dropdown.Item eventKey="Taggers review">Taggers review</Dropdown.Item>
        </DropdownButton>
      </Modal.Header>

      {/* Campaign review table */}
      {dropdownFilterValue === "Campaign review" && (
        <Modal.Body>
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th># taggers</th>
                <th># items</th>
                <th># completed</th>
                <th># validating</th>
                <th># translating</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>{activeCampaign.title}</td>
                <td>{activeCampaign.description}</td>
                <td>{activeCampaign.completed ? 'Closed' : 'In progress'}</td>
                <td>{[...new Set([...activeCampaign.assignedTaggers ,...activeCampaign.assignedTranslators])].length}</td>
                <td>{activeCampaignItems.length}</td>
                <td>{activeCampaignItems.filter(item => item.status === 'completed').length}</td>
                <td>{activeCampaignItems.filter(item => item.status === 'validating').length}</td>
                <td>{activeCampaignItems.filter(item => item.status === 'translating').length}</td>
              </tr>
            </tbody>
          </Table>
        </Modal.Body>
      )}
      
      {/* Items review table */}
      {dropdownFilterValue === "Items review" && (
        <Modal.Body>
          <Table>
            <thead>
              <tr>
                <th>Item id</th>
                <th>Original sentence</th>
                <th>Translated sentence</th>
                <th>Aprove Score</th>
                <th>Reject Score</th>
                <th>Validation Threshold</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {activeCampaignItems.map((item, id) => {
                let [itemId, originalSentence, translatedSentence, aproveScore, rejectScore, validationThreshold, status] = getTableParams(item);

                return (
                  <tr key={"table-item" + item.id + item.status + id}>
                    <td>{itemId}</td>
                    <td>{originalSentence}</td>
                    <td>{translatedSentence}</td>
                    <td>{aproveScore}</td>
                    <td>{rejectScore}</td>
                    <td>{validationThreshold}</td>
                    <td>{status}</td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Modal.Body>
      )}

      {/* Items progress table */}
      {dropdownFilterValue === "Items progress" && (
        <Modal.Body>
          <Table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Status</th>
                <th># Iterations</th>
                <th>Last translator</th>
                <th>Last validator group</th>
              </tr>
            </thead>

            <tbody>
              {activeCampaignItems.map((item, id) => {
                let [itemId, status, iterations, lastTranslator, lastTaggerGroup] = getTableParams(item);
                return (
                  <tr key={"table-item" + item.id + item.status + id}>
                    <td>{itemId}</td>
                    <td>{status}</td>
                    <td>{iterations}</td>
                    <td>{lastTranslator}</td>
                    <td>{lastTaggerGroup}</td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Modal.Body>
      )}
      
      {/* Answers review table */}
      {dropdownFilterValue === "Answers review" && (
        <Modal.Body>
          <Table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Iteration</th>
                <th>Tagger</th>
                <th>Role</th>
                <th>Translation</th>
                <th>Translation Quality</th>
                <th>Comment</th>
                <th>Answer time (s)</th>
              </tr>
            </thead>

            <tbody>
              {activeCampaignAnswers.map((answer, id) => {
                let [campItem, iterations, tagger, taggerRole, translation, transQuality, comment, ansTime] = getTableParams(answer);
                return (
                  <tr key={"table-answer" + answer.profile + answer.id + id}>
                    <td>{campItem}</td>
                    <td>{iterations}</td>
                    <td>{tagger}</td>
                    <td>{taggerRole}</td>
                    <td>{translation}</td>
                    <td>{transQuality}</td>
                    <td>{comment}</td>
                    <td>{ansTime}</td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Modal.Body>
      )}

      {/* Taggers review table */}
      {dropdownFilterValue === "Taggers review" && (
        <Modal.Body>
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th># assigned items</th>
                <th># translated items</th>
                <th># validated items</th>
                <th>Total employed time (s)</th>
              </tr>
            </thead>

            <tbody>
              {profilesList.map((profile, id) => {
                let [name, assignedRole, numberAssignedItems, numberTranslatedItems, numberValidatedItems, totalTimeEmployed] = getTableParams(profile);

                return (
                  <tr key={"table" + profile.user + id} >
                    <td>{name}</td>
                    <td>{assignedRole}</td>
                    <td>{numberAssignedItems}</td>
                    <td>{numberTranslatedItems}</td>
                    <td>{numberValidatedItems}</td>
                    <td>{totalTimeEmployed}</td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </Modal.Body>
      )}

      <Modal.Footer>
        <Button
          color="success"
          onClick={handleDownloadCsv}
        >
          Download TSV
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalReview;
