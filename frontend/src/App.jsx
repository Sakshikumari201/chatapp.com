import Login from "./login/Login.jsx"
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Route ,Routes, Navigate } from "react-router-dom";
import Register from "./register/Register.jsx";
import Home from "./home/Home.jsx";
import { VerifyUser } from "./utils/VerifyUser.jsx";
import { useAuth } from "./context/AuthContext";

function App() {
  const { authUser } = useAuth();
  
  return (
    <>
    <div className="p-2 w-screen h-screen flex items-center justify-center">
      <Routes>
        <Route path="/login" element={authUser ? <Navigate to="/" /> : <Login/>}/>
        <Route path="/register" element={authUser ? <Navigate to="/" /> : <Register/>}/>
        <Route element={<VerifyUser/>}>
        <Route path="/" element={<Home/>}/>
        </Route>
      </Routes>
      <ToastContainer/>
    </div>

    </>
  )
}

export default App