import { createContext, useState, useEffect } from "react";
import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();

export default AuthContext;

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() =>
    localStorage.getItem("authTokens")
      ? JSON.parse(localStorage.getItem("authTokens"))
      : null
  );

  const [user, setUser] = useState(() =>
    localStorage.getItem("authTokens")
      ? jwt_decode(localStorage.getItem("authTokens"))
      : null
  );

  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const loginUser = async (username, password) => {
    let headers = { "Content-Type": "application/json" }
    let body = JSON.stringify({ username, password })
    localStorage.clear();

    axios.post("/user/login/", body, { headers })
      .then((response) => {
        setAuthTokens(response.data);
        setUser(jwt_decode(response.data.access));
        localStorage.setItem("authTokens", JSON.stringify(response.data));

        // get profile object usando username
        navigate("/");
      })
      .catch((err) => {
        console.log(err)
        alert("Something went wrong!");
      });
  };
  
  const registerUser = async (username, password, password2, role, skills) => {
    let headers = { "Content-Type": "application/json" }
    let body = JSON.stringify({ username, password, password2, role, skills })

    axios.post("/user/register/", body, { headers })
      .then((response) => {
        
        if (typeof response.data !== 'undefined' && response.data.username !== 'undefined') 
        axios
          .put("/api/profiles/update_profile/", { username: response.data.username, role: role, skills: skills})
          .then((res) => console.log(res.data))
          .catch((err) => console.log(err));
        navigate("/login");
      })
      .catch((err) => {
        console.log(err);
        if (typeof JSON.parse(err.request.response) !== 'undefined') {
          let responseEntries = Object.entries(JSON.parse(err.request.response));
          let errorMsg = "";

          for (let i = 0; i < responseEntries.length; i++) {
            errorMsg =  errorMsg + responseEntries[i][0] + ":\n"
            for (let j = 0; j < responseEntries[i][1].length; j++) {
              errorMsg = errorMsg + responseEntries[i][1][j] + "\n";
            }
            if (i !== responseEntries.length - 1) {
              errorMsg = errorMsg + "\n";
            }
          }

          console.log(errorMsg);
          alert(errorMsg);
        } else {
          alert("Something went wrong!");
        }
      });
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem("authTokens");
    localStorage.clear();
    navigate("/");
  };

  const contextData = {
    user,
    setUser,
    authTokens,
    setAuthTokens,
    registerUser,
    loginUser,
    logoutUser
  };

  useEffect(() => {
    if (authTokens) {
      setUser(jwt_decode(authTokens.access));
    }
    setLoading(false);
  }, [authTokens, loading]);

  return (
    <AuthContext.Provider value={contextData}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
};