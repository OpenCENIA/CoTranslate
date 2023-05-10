import {
  Form,
  FormGroup,
  Input,
  Label,
  FormText,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from "reactstrap";

import React, { useState } from "react";

import Button from 'react-bootstrap/Button';

import Modal from 'react-bootstrap/Modal';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const ModalCreateEditCampaign = (props) => {
  const { content, handleSubmit, skillList, profilesList, modal, setModal, createNewCampaign } = props;
  const [activeCampaign, setActiveCampaign] = useState(props.activeCampaign);
  const [activeCampaignDataset, setActiveCampaignDataset] = useState({'campaignDataset': ''});

  const [dropdownCampaignTypeOpen, setDropdownCampaignTypeOpen] = useState(false);
  const [dropdownSkillsOpen, setDropdownSkillsOpen] = useState(false);
  const [dropdownTranslatorsOpen, setDropdownTranslatorsOpen] = useState(false);
  const [dropdownTaggersOpen, setDropdownTaggersOpen] = useState(false);
  const toggleDropdownCampaignType = () => setDropdownCampaignTypeOpen((prevState) => !prevState);
  const toggleDropdownSkills = () => setDropdownSkillsOpen((prevState) => !prevState);
  const toggleDropdownTranslators = () => setDropdownTranslatorsOpen((prevState) => !prevState);
  const toggleDropdownTaggers = () => setDropdownTaggersOpen((prevState) => !prevState);

  const campaignTypes = [content.roleTranslation, content.roleValidation];

  const handleChange = (e) => {
    let { name, value } = e.target;
    let requiredSkills = [...activeCampaign.requiredSkills];
    let assignedTranslators = [...activeCampaign.assignedTranslators];
    let assignedTaggers = [...activeCampaign.assignedTaggers];
    let campaignDataset = '';
    let newIsNllb = activeCampaign.isNllb;
    let newCampaignType = activeCampaign.campaignType;

    if (e.target.type === 'checkbox') {
      value = e.target.checked;
      if (e.target.name === 'required-skills') {
        const index = activeCampaign.requiredSkills.indexOf(parseInt(e.target.id));

        if (value === true) {
          if (index < 0) { 
            requiredSkills.push(parseInt(e.target.id));

            profilesList.forEach((profile, id) =>
              {
                let indexTranslators = activeCampaign.assignedTranslators.indexOf(parseInt(profile.id));
                let indexTaggers = activeCampaign.assignedTaggers.indexOf(parseInt(profile.id));
                
                let checker = (arr, target) => target.every(v => arr.includes(v));

                if (indexTranslators > -1) { // only splice array when item is found
                  if (checker(profile.skills, requiredSkills) !== true) {
                    assignedTranslators.splice(index, 1); // 2nd parameter means remove one item only
                  }                    
                }

                if (indexTaggers > -1) { // only splice array when item is found
                  if (checker(profile.skills, requiredSkills) !== true) {
                    assignedTaggers.splice(index, 1); // 2nd parameter means remove one item only
                  }                    
                }
              });

          }
        } else {
          if (index > -1) { // only splice array when item is found
            requiredSkills.splice(index, 1); // 2nd parameter means remove one item only
          }
        }
        requiredSkills.sort()
      }

      if (e.target.name === 'assigned-translators') {
        const index = activeCampaign.assignedTranslators.indexOf(parseInt(e.target.id));

        if (value === true) {
          if (index < 0) { 
            assignedTranslators.push(parseInt(e.target.id))
          }
        } else {
          if (index > -1) { // only splice array when item is found
            assignedTranslators.splice(index, 1); // 2nd parameter means remove one item only
          }
        }
        assignedTranslators.sort()
      }

      if (e.target.name === 'assigned-taggers') {
        const index = activeCampaign.assignedTaggers.indexOf(parseInt(e.target.id));

        if (value === true) {
          if (index < 0) { 
            assignedTaggers.push(parseInt(e.target.id))
          }
        } else {
          if (index > -1) { // only splice array when item is found
            assignedTaggers.splice(index, 1); // 2nd parameter means remove one item only
          }
        }
        assignedTaggers.sort()
      }

      if (e.target.name === 'nllb-check') {
        newIsNllb = !newIsNllb;
      }
    }

    if (e.target.type === 'dropdown') {
      if (e.target.name === 'campaign-type-selector') {
        newCampaignType = parseInt(e.target.value);
      }
    }

    if (e.target.type === 'file') {
      let inputFiles = document.getElementById('datasetFileInput')

      if (inputFiles.files.length !== 0) {
        campaignDataset = inputFiles.files[0]
      }

    }
  
    let newActiveCampaign = { ...activeCampaign, [name]: e.target.type !== 'number' ? value : Math.round(parseFloat(value.replace(/,/g, ".")).toFixed(2)), 'requiredSkills': requiredSkills, 'assignedTranslators': assignedTranslators, 'assignedTaggers': assignedTaggers, 'isNllb': newIsNllb, 'campaignType': newCampaignType};
    let newActiveCampaignDataset = {'campaignDataset': campaignDataset};

    setActiveCampaign(newActiveCampaign);
    setActiveCampaignDataset(newActiveCampaignDataset);
  };

	const handleClose = () => {
    setModal(false);
	}
  
  return (
    <Modal show={modal} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          {content.modalTitle}
        </Modal.Title>      
      </Modal.Header>

      <Modal.Body>
        <Form>

          {/* Title */}
          <FormGroup>
            <Label for="campaign-title">{content.campaignTitle}</Label>
            <Input
              type="text"
              id="campaign-title"
              name="title"
              value={typeof activeCampaign.title!== 'undefined' ? activeCampaign.title : ''}
              onChange={handleChange}
              placeholder={content.campaignTitlePlaceholder}
            />
          </FormGroup>

          {/* Description */}
          <FormGroup>
            <Label for="campaign-description">{content.campaignDescription}</Label>
            <Input
              type="text"
              id="campaign-description"
              name="description"
              value={typeof activeCampaign.description !== 'undefined' ? activeCampaign.description : ''}
              onChange={handleChange}
              placeholder={content.campaignDescriptionPlaceholder}
            />
          </FormGroup>

          {/* Campaign state */}
          {!createNewCampaign && (
            <FormGroup check>
              <Label check>
                <Input
                  type="checkbox"
                  name="completed"
                  checked={activeCampaign.completed}
                  onChange={handleChange}
                />
                {content.campaignCompleteCheckbox}
              </Label>
            </FormGroup>
          )}

          {/* Original language */}
          <FormGroup>
            <Label for="campaign-original-language">{content.campaignOriginalLang}</Label>
            <Input
              type="text"
              id="campaign-original-language"
              name="originalLanguage"
              value={typeof activeCampaign.originalLanguage !== 'undefined' ? activeCampaign.originalLanguage : ''}
              onChange={handleChange}
              placeholder={content.campaignOriginalLangPlaceholder}
            />
          </FormGroup>
          
          {/* Target language */}
          <FormGroup>
            <Label for="campaign-target-language">{content.campaignTargetLang}</Label>
            <Input
              type="text"
              id="campaign-target-language"
              name="targetLanguage"
              value={typeof activeCampaign.targetLanguage !== 'undefined' ? activeCampaign.targetLanguage : ''}
              onChange={handleChange}
              placeholder={content.campaignTargetLangPlaceholder}
            />
          </FormGroup>

          {/* Number of taggers per validation */}
          {(activeCampaign.isNllb || activeCampaign.campaignType === 2) && (
            <FormGroup>
              <Label for="campaign-number-taggers">{content.amountTaggersTitle}</Label>
              <Input
                id="exampleNumber"
                name="taggersPerValidation"
                placeholder="1"
                type="number"
                min={0}
                step={1}
                value={typeof activeCampaign.taggersPerValidation !== 'undefined' ? activeCampaign.taggersPerValidation : 1}
                onChange={handleChange}
              />
            </FormGroup>
          )}

          {/* Threshold to validate a translation */} 
          {(activeCampaign.isNllb || activeCampaign.campaignType === 2) && (
            <FormGroup>
              <Label for="campaign-threshold">{content.thresholdTitle}</Label>
              <Input
                id="exampleNumber"
                name="validationThreshold"
                placeholder="50"
                type="number"
                min={0}
                max={100}
                step={1}
                value={typeof activeCampaign.validationThreshold !== 'undefined' ? activeCampaign.validationThreshold : 50}
                onChange={handleChange}
              />
            </FormGroup>
          )}

          {/* Campaign required Translators */}
          {(activeCampaign.isNllb || activeCampaign.campaignType === 1) && (
            <FormGroup>
              <Label check for="campaign-translators">{content.translatorsTitle}</Label>
              <Row>
                {typeof activeCampaign.assignedTranslators !== 'undefined' && activeCampaign.assignedTranslators.map((profile, id) => {
                  let profileName = profilesList.filter(p => p.id === profile)[0].user;
                  return(
                    <Col key={profile + id + "assignedtranslator"} style={styles.SelectedItem}>
                      <FormGroup check>
                        <Label check>
                          <Input
                            type="checkbox"
                            name="assigned-translators"
                            id={profile}
                            checked={activeCampaign.assignedTranslators.includes(profile)}
                            onChange={handleChange}
                          />
                          {profileName}
                        </Label>
                      </FormGroup>
                    </Col>
                  )
                })}
              </Row>

              <Dropdown isOpen={dropdownTranslatorsOpen} toggle={toggleDropdownTranslators} direction="down">
                <DropdownToggle caret color="primary">
                  {content.translatorsDropdownDefault}
                </DropdownToggle>
              
                <DropdownMenu>
                  {typeof activeCampaign !== 'undefined' && profilesList.map((profile, id) => {
                    let checker = (arr, target) => target.every(v => arr.includes(v));
                    if (checker(profile.skills, activeCampaign.requiredSkills) === true && profile.role === 1) {
                      let profId = parseInt(profile.id);
                      return (
                        <DropdownItem key={profile+id} toggle={false} onClick={() => {}}>
                          <div key={'inline-checkbox'}>
                            <FormGroup check>
                              <Label check>
                                <Input
                                  type="checkbox"
                                  name="assigned-translators"
                                  id={profId}
                                  checked={typeof activeCampaign.assignedTranslators !== 'undefined' && activeCampaign.assignedTranslators.includes(profId)}
                                  onChange={handleChange}
                                />
                                {profile.user}
                              </Label>
                            </FormGroup>
                          </div>
                        </DropdownItem>
                      )
                    }
                    return (null)
                  })}					
                </DropdownMenu>
              </Dropdown>
            </FormGroup>
          )}

          {/* Campaign required Taggers */}
          {(activeCampaign.isNllb || activeCampaign.campaignType === 2) && (
            <FormGroup>
              <Label check for="campaign-taggers">{content.taggersTitle}</Label>
              <Row>
                {typeof activeCampaign.assignedTaggers !== 'undefined' && activeCampaign.assignedTaggers.map((profile, id) => {
                  let profileName = profilesList.filter(p => p.id === profile)[0].user;
                  return(
                    <Col key={profile + id + "assignedTaggers"} style={styles.SelectedItem}>
                      <FormGroup check>
                        <Label check>
                          <Input
                            type="checkbox"
                            name="assigned-taggers"
                            id={profile}
                            checked={activeCampaign.assignedTaggers.includes(profile)}
                            onChange={handleChange}
                          />
                          {profileName}
                        </Label>
                      </FormGroup>
                    </Col>
                  )
                })}
              </Row>

              <Dropdown isOpen={dropdownTaggersOpen} toggle={toggleDropdownTaggers} direction="down">
                <DropdownToggle caret color="primary">
                  {content.taggersDropdownDefault}
                </DropdownToggle>
              
                <DropdownMenu>
                  {typeof activeCampaign !== 'undefined' && profilesList.map((profile, id) => {
                    let checker = (arr, target) => target.every(v => arr.includes(v));
                    if (checker(profile.skills, activeCampaign.requiredSkills) === true && profile.role === 1) {
                      let profId = parseInt(profile.id);
                      return (
                        <DropdownItem key={profile+id} toggle={false} onClick={() => {}}>
                          <div key={'inline-checkbox'}>
                            <FormGroup check>
                              <Label check>
                                <Input
                                  type="checkbox"
                                  name="assigned-taggers"
                                  id={profId}
                                  checked={typeof activeCampaign.assignedTaggers !== 'undefined' && activeCampaign.assignedTaggers.includes(profId)}
                                  onChange={handleChange}
                                />
                                {profile.user}
                              </Label>
                            </FormGroup>
                          </div>
                        </DropdownItem>
                      )
                    }
                    return (null)
                  })}					
                </DropdownMenu>
              </Dropdown>
            </FormGroup>
          )}

          {/* Load dataset */}
          {createNewCampaign && (
            <div>
              <FormGroup>
              <Label for="campaign-dataset">{content.datasetTitle}</Label>
                <Input type="file" name="datasetFileInput" id="datasetFileInput" accept=".csv,.json" onChange={handleChange}/>
                <FormText color="muted">
                  {content.datasetHint}
                </FormText>
              </FormGroup>
            </div>
          )}

        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => handleClose()}
        >
          {content.cancelButton}
        </Button>
        <Button
          variant="primary"
          disabled={createNewCampaign && (activeCampaign.campaignType === 0 || activeCampaignDataset.campaignDataset === '')}
          onClick={() => handleSubmit(activeCampaign, activeCampaignDataset)}
        >
          {content.submitButton}
        </Button>
      </Modal.Footer>
      
    </Modal>
  );
};

export default ModalCreateEditCampaign;

const styles = {
  SelectedItem: {
    marginLeft: 1,
    marginRight: 1,
  }
};
