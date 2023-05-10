import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';

import AuthContext from "../context/AuthContext";

import { Link } from "react-router-dom";
import axios from "axios";

const TaggerPage = (props) => {
  const { content } = props;

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState('');

  // trigger on component mount
  useEffect(() => {
    if (user) {
      if (user.role === 'Manager') {
        navigate("/manager")
      } else {
        axios
          .get("/api/campaigns/")
          .then((res) => {
            setCampaigns(res.data)
          })
          .catch((err) => console.log(err));
      }
    } else {
      navigate("/login")
    }
  }, [navigate, user]);
  
  if (user) {
    return (
      <Container fluid>
        <h1 className="text-center my-4">{content.taggerTitle}: {user.username}</h1>
        <Row style={styles.Row}>
          <Col md={6} sm={10} style={styles.Col}>
            <Card>

              <Card.Body>
                <Table>
                  <thead>
                    <tr>
                      <th className="text-center">{content.campaignTitle}</th>
                    </tr>
                    {campaigns !== '' && campaigns.map((campaign, id) => {
                      let checkTranslator = typeof campaign.assignedTranslators !== 'undefined' && campaign.assignedTranslators.includes(user.user_id) && campaign.completed === false;
                      let checkTagger = typeof campaign.assignedTaggers !== 'undefined' && campaign.assignedTaggers.includes(user.user_id) && campaign.completed === false;
                      if (checkTranslator || checkTagger) {
                        return (
                          <tr key={user.user_id + campaign.title}>
                            <td className="text-center">
                              <Link onClick={() => {
                                localStorage.setItem('campaign', JSON.stringify(campaign));
                              }}
                              to={"/campaign"} >
                                {campaign.title}
                              </Link>
                            </td>
                          </tr>
                        ) 
                      }
                      return(<tr  key={user.user_id + campaign.title + "no render"}></tr>)
                    })}
                  </thead>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }
  return (<></>);
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
  }
}
