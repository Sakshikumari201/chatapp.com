import Login from "./login/Login.jsx"
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Route ,Routes, Navigate } from "react-router-dom";
import Register from "./register/Register.jsx";
import Home from "./home/Home.jsx";
import Profile from "./profile/Profile.jsx";
import { VerifyUser } from "./utils/VerifyUser.jsx";
import { useAuth } from "./context/AuthContext";
import { useEffect } from "react";
import { requestForToken, onMessageListener } from "./utils/firebase.js";
import { toast } from 'react-toastify';

function App() {
  const { authUser } = useAuth();
  
  useEffect(() => {
    if (authUser) {
      requestForToken();
    }
  }, [authUser]);

  useEffect(() => {
    onMessageListener()
      .then((payload) => {
        toast.info(`${payload.notification.title}: ${payload.notification.body}`);
      })
      .catch((err) => console.log("failed: ", err));
  }, []);
  
  return (
    <>
    <div className="p-2 w-screen h-screen flex items-center justify-center">
      <Routes>
        <Route path="/login" element={authUser ? <Navigate to="/" /> : <Login/>}/>
        <Route path="/register" element={authUser ? <Navigate to="/" /> : <Register/>}/>
        <Route element={<VerifyUser/>}>
        <Route path="/" element={<Home/>}/>
        <Route path="/profile/:id" element={<Profile/>}/>
        </Route>
      </Routes>
      <ToastContainer/>
    </div>

    </>
  )
}

export default App