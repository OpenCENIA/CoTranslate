import { useContext, useEffect } from "react";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // trigger on component mount
  useEffect(() => {
    if (user) {
      if (user.role === 'Tagger') {
        navigate("/tagger")
      }
      if (user.role === 'Manager') {
        navigate("/manager")
      }
    } else {
      navigate("/login")
    }
  }, [navigate, user]);

  return (
    <section>
    </section>
  );
};

export default Home;
