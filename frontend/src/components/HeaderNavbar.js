import { useContext, useState } from "react";
import AuthContext from "../context/AuthContext";
import ModalStatistics from "../components/ModalStatistics";

import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';

const HeaderNavbar = (props) => {
  const { user, logoutUser } = useContext(AuthContext);
  const {count, availableLanguages, setAppLang, langsOb, content, activeLang, setActiveLang} = props;

  const [modalStatistics, setModalStatistics] = useState(false);

  const modalStatisticsToggle = () => {
    // Agregar aqui la actualizacion de estadisticas en vez del modal, que se actualice onclick

    if (user && user.role === "Tagger") {
      setModalStatistics(!modalStatistics);
    }
  };

  const onChangeLang = (newLang) => {
    localStorage.setItem('activeLang', newLang);
    setActiveLang(newLang);
    setAppLang(langsOb[newLang])
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="/">{content.appName}</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="/">{content.home}</Nav.Link>
            {user && user.role === "Tagger" && (
              <Nav.Link onClick={modalStatisticsToggle}>{content.statistics}</Nav.Link>
            )}

            {count > 0 && (
            <Nav.Link disabled>
              {content.counterMsg}: {' '}
            { count >= 60 && (parseInt(count / 60) < 10 ? '0' + parseInt(count / 60) : parseInt(count/60)) + ":"}
            {parseInt(count % 60) < 10 ? '0' + parseInt(count % 60) : parseInt(count % 60)}
            </Nav.Link>
            )}

          
          </Nav>
          {user ? (
            <Nav className="justify-content-end">
              <Nav.Link onClick={logoutUser}>{content.logout}</Nav.Link>
            </Nav>
          ) : (
            <Nav className="justify-content-end">
              <Nav.Link href="/login">{content.login}</Nav.Link>
              <Nav.Link href="/signup">{content.signUp}</Nav.Link>
            </Nav>
          )}
          <Nav className="justify-content-end">
            <NavDropdown
              title={activeLang}
              id="basic-nav-dropdown"
              align={{ lg: 'end' }}
              onSelect={onChangeLang}
            >
              {availableLanguages.map((lang, id) => {
                return(
                  <NavDropdown.Item key={"lang-selector-"+lang+id} eventKey={lang}>{lang}</NavDropdown.Item>
                )
              })}
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>

        <ModalStatistics modalStatistics={modalStatistics} setModalStatistics={setModalStatistics} content={langsOb[activeLang].modalStatistics} />
      </Container>
    </Navbar>
  );
};

export default HeaderNavbar;
