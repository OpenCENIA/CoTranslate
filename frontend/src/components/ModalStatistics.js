import React, { useState, useEffect, useContext } from "react";

import AuthContext from "../context/AuthContext";
import axios from "axios";

import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Modal from 'react-bootstrap/Modal';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';


const ModalStatistics = (props) => {
  const { user } = useContext(AuthContext);

  const { content, modalStatistics, setModalStatistics } = props;
	const [selectedFilter, setSelectedFilter] = useState(0);
	const [answeredItems, setAnsweredItems] = useState([]);
	const [campaigns, setCampaigns] = useState([]);
	// const dropdownItems = ["General", "Campaign"];
	const dropdownItems = [content.generalTitle, content.campaignTitle];

	const handleClose = () => {
		setModalStatistics(false);
	}

	const handleSelectedFilter = (e) => {
		setSelectedFilter(e);
	}

	const refreshList = () => {
		if (user) {
			axios
				.put("/api/campaign_items_answer/get_user_answers/", {userTest: user, campaign: ""})
				.then((res) => {
					if (res.data.status !== 'Error') {
						setAnsweredItems(res.data);
					}
				})
				.catch((err) => console.log(err));

			axios
				.get("/api/campaigns/")
				.then((res) => {
					setCampaigns(res.data.filter(campaign => campaign.assignedTranslators.includes(user.profile.id) || campaign.assignedTaggers.includes(user.profile.id)))
				})
				.catch((err) => console.log(err));
		}
	}

  // trigger on component mount 
  useEffect(() => {
		refreshList();
  }, []);

	if (user)
		return (
			<Modal onShow={refreshList} centered size="lg" show={modalStatistics && user} onHide={handleClose}>
			<Modal.Header>{content.title}</Modal.Header>
				<Modal.Body>
					{/* <Modal.Title>Select a filter</Modal.Title> */}
					<Container fluid className='d-flex'>
						<DropdownButton title={dropdownItems[parseInt(selectedFilter)]} id="dropdown-menu-align-responsive-1" onSelect={handleSelectedFilter}>
							{dropdownItems.map((item, id) => {
								return (
									<Dropdown.Item key={item + id + "dropwdon selector"} eventKey={id}>{item}</Dropdown.Item>
								)
							})}
						</DropdownButton>

						{selectedFilter === 1 && (
							<DropdownButton title={"Campaign"} style={styles.DropdownSelector} id="dropdown-menu-align-responsive-1" onSelect={() => {}}>
								<Dropdown.Item key={"dropwdon campaign selector"} eventKey={'0'}>{content.campaignTitle}</Dropdown.Item>
							</DropdownButton>
						)}

					</Container>
				</Modal.Body>

					{parseInt(selectedFilter) === 0 && (
						<Container>
							<Modal.Body>
								<Table>
									<thead>
										<tr>
											<th className="text-start">{content.gRow1}</th>
											<td className="text-end">{campaigns.length}</td>
										</tr>
										<tr>
											<th>{content.gRow2}</th>
											<td className="text-end">{answeredItems.length}</td>
										</tr>
										<tr>
											<th>{content.gRow3}</th>
											<td className="text-end">{answeredItems.map(item => item.answerTime).reduce((partialSum, a) => partialSum + a, 0)}</td>
										</tr>
									</thead>
								</Table>

								<Table>
									<thead>
										<tr>
											<th>{content.gRow4}</th>
											<td className="text-end">{answeredItems.filter(item => item.type === 'translation').length}</td>
										</tr>
										<tr>
											<th>{content.gRow5}</th>
											<td className="text-end">{answeredItems.filter(item => item.type === 'validation').length}</td>
										</tr>
									</thead>
								</Table>

								<Table>
									<thead>
										<tr>
											<th>{content.gRow6}</th>
											<td className="text-end">{answeredItems.length !== 0 ? answeredItems.map(item => item.answerTime).reduce((partialSum, a) => partialSum + a, 0) / answeredItems.length : 0}</td>
										</tr>
									</thead>
								</Table>
							</Modal.Body>
						</Container>
					)}
					{parseInt(selectedFilter) === 1 && (
						<Modal.Body>
							{campaigns.map(campaign => {
								let assignedRole = [];
								if (campaign.assignedTranslators.includes(user.profile.id)) {
									assignedRole.push(content.translator);
								}
								if (campaign.assignedTaggers.includes(user.profile.id)) {
									assignedRole.push(content.validator);
								}
								return (
									<Table key={"tabla-statistics-campaign" + campaign.title + campaign.description}>
										<thead>
											<tr>
												<th className="text-center" colSpan="2">{campaign.title}</th>
											</tr>
											<tr>
												<th>{content.cRole}</th>
												<td className="text-end">{assignedRole.join(", ")}</td>
											</tr>

											{assignedRole.includes(content.translator) && (
											<tr>
												<th>{content.cTranslate}</th>
												<td className="text-end">{answeredItems.filter(item => item.type === 'translation' && item.campaign === campaign.id).length}</td>
											</tr>
											)}

											{assignedRole.includes(content.validator) && (
											<tr>
												<th>{content.cValidate}</th>
												<td className="text-end">{answeredItems.filter(item => item.type === 'validation' && item.campaign === campaign.id).length}</td>
											</tr>
											)}
											<tr>
												<th>{content.cTime}</th>
												<td className="text-end">{answeredItems.filter(item => item.campaign === campaign.id).map(answer => answer.answerTime).reduce((a, b) => a + b, 0)}</td>
												</tr>
										</thead>
									</Table>
								)
							})}
						</Modal.Body>
					)}
			</Modal>
		);
	
	return (null);
};

export default ModalStatistics;

const styles = {
	DropdownSelector: {
		marginLeft: "1%",
	}
}
