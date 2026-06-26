import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/login.jsx";
import Dashboard from "./components/Dashboard.jsx";

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
