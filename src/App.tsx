import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Servicios from './pages/Servicios';
import MisCitas from './pages/MisCitas';
import Referidos from './pages/Referidos';
import AdminDashboard from './pages/admin/Dashboard';
import AdminClientas from './pages/admin/Clientas';
import AdminCitas from './pages/admin/Citas';
import AdminServicios from './pages/admin/Servicios';

function LayoutWithNav({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/servicios" element={<LayoutWithNav><Servicios /></LayoutWithNav>} />
          <Route path="/citas" element={<LayoutWithNav><MisCitas /></LayoutWithNav>} />
          <Route path="/referidos" element={<LayoutWithNav><Referidos /></LayoutWithNav>} />
          
          <Route path="/admin" element={<LayoutWithNav><AdminDashboard /></LayoutWithNav>} />
          <Route path="/admin/clientas" element={<LayoutWithNav><AdminClientas /></LayoutWithNav>} />
          <Route path="/admin/citas" element={<LayoutWithNav><AdminCitas /></LayoutWithNav>} />
          <Route path="/admin/servicios" element={<LayoutWithNav><AdminServicios /></LayoutWithNav>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
