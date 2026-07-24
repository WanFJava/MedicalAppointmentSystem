import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import SpecialtyManager from './pages/admin/SpecialtyManager';
import DoctorManager from './pages/admin/DoctorManager';
import ReceptionistDashboard from './pages/admin/ReceptionistDashboard';
import DoctorDashboard from './pages/admin/DoctorDashboard';
import MedicineManager from './pages/admin/MedicineManager';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import BookingPage from './pages/BookingPage';
import MyAppointments from './pages/MyAppointments';
import PatientProfile from './pages/PatientProfile';
import SearchPage from './pages/SearchPage';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      {/* Public / Patient Routes with Header & Footer */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/login" element={user ? (['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(user.role) ? <Navigate to="/admin" /> : <Navigate to="/" />) : <Login />} />
        <Route path="/register" element={user ? (['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(user.role) ? <Navigate to="/admin" /> : <Navigate to="/" />) : <Register />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/my-appointments" element={<MyAppointments />} />
        <Route path="/profile" element={user ? <PatientProfile /> : <Navigate to="/login" />} />
      </Route>
      
      {/* Admin Protected routes */}
      <Route path="/admin" element={['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(user?.role) ? <AdminLayout /> : <Navigate to="/" />}>
        <Route index element={<Dashboard />} />
        <Route path="specialties" element={<SpecialtyManager />} />
        <Route path="doctors" element={<DoctorManager />} />
        <Route path="appointments" element={<ReceptionistDashboard />} />
        <Route path="my-schedule" element={<DoctorDashboard />} />
        <Route path="medicines" element={<MedicineManager />} />
      </Route>
    </Routes>
  );
}

export default App;
