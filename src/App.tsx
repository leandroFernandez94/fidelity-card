import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Servicios from './pages/Servicios';
import MisCitas from './pages/MisCitas';
import Referidos from './pages/Referidos';
import Premios from './pages/Premios';
import AdminDashboard from './pages/admin/Dashboard';
import AdminClientas from './pages/admin/Clientas';
import AdminCitas from './pages/admin/Citas';
import AdminServicios from './pages/admin/Servicios';
import AdminPremios from './pages/admin/Premios';

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
          <Route
            path="/"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/servicios"
            element={
              <RequireAuth>
                <LayoutWithNav>
                  <Servicios />
                </LayoutWithNav>
              </RequireAuth>
            }
          />
          <Route
            path="/citas"
            element={
              <RequireAuth>
                <LayoutWithNav>
                  <MisCitas />
                </LayoutWithNav>
              </RequireAuth>
            }
          />
          <Route
            path="/referidos"
            element={
              <RequireAuth>
                <LayoutWithNav>
                  <Referidos />
                </LayoutWithNav>
              </RequireAuth>
            }
          />
          <Route
            path="/premios"
            element={
              <RequireAuth>
                <LayoutWithNav>
                  <Premios />
                </LayoutWithNav>
              </RequireAuth>
            }
          />
          
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <LayoutWithNav>
                  <AdminDashboard />
                </LayoutWithNav>
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/clientas"
            element={
              <RequireAdmin>
                <LayoutWithNav>
                  <AdminClientas />
                </LayoutWithNav>
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/citas"
            element={
              <RequireAdmin>
                <LayoutWithNav>
                  <AdminCitas />
                </LayoutWithNav>
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/servicios"
            element={
              <RequireAdmin>
                <LayoutWithNav>
                  <AdminServicios />
                </LayoutWithNav>
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/premios"
            element={
              <RequireAdmin>
                <LayoutWithNav>
                  <AdminPremios />
                </LayoutWithNav>
              </RequireAdmin>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
