import { React, useState } from "react";
import HeaderNavbar from "./components/HeaderNavbar";
// import Footer from "./components/Footer";
import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import HomePage from "./views/homePage";
import LoginPage from "./views/loginPage";
import TaggerPage from "./views/taggerPage";
import ManagerPage from "./views/managerPage";
import SignUpPage from "./views/signUpPage";
import CampaignPage from "./views/campaignPage";
import TranslationPage from "./views/itemTranslationgPage";
import ValidationPage from "./views/itemValidationPage";

import langs from "./lang/langs";

function App() {
  const availableLanguages = ["en", "spa"];
  const [activeLang, setActiveLang] = useState(
    localStorage.getItem("activeLang")
      ? localStorage.getItem("activeLang")
      : availableLanguages[0])  
  const [appLang, setAppLang] = useState(langs[activeLang]);

  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <AuthProvider>
        <HeaderNavbar
          count={count}
          setCount={setCount}
          availableLanguages={availableLanguages}
          langsOb={langs}
          content={appLang.headerNavbar}
          setAppLang={setAppLang}
          activeLang={activeLang}
          setActiveLang={setActiveLang}
        />

        <Routes>
            <Route path="login" element={<LoginPage content={appLang.loginPage}/>} />
            <Route path="signup" element={<SignUpPage content={appLang.signUpPage}/>} />
            <Route path="tagger" element={<TaggerPage content={appLang.taggerPage}/>} />
            <Route path="manager" element={<ManagerPage content={appLang.managerPage} appLang={appLang}/>} />
            <Route path="campaign" element={<CampaignPage content={appLang.campaignPage}/>} />
            <Route path="campaign/translate" element={<TranslationPage count={count} setCount={setCount} content={appLang.translationPage}/>} />
            <Route path="campaign/validate" element={<ValidationPage count={count} setCount={setCount} content={appLang.validationPage}/>} />
            <Route path="*" element={<p>There's nothing here: 404!</p>} />
            <Route path="" element={<HomePage content={appLang.homePage}/>} />
        </Routes>
      </AuthProvider>
      {/* <Footer /> */}
    </div>
  );
}

export default App;