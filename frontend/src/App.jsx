import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import SpecialtyManager from './pages/admin/SpecialtyManager';
import DoctorManager from './pages/admin/DoctorManager';
import AdminSchedulePage from './pages/admin/AdminSchedulePage';
import ReceptionistDashboard from './pages/admin/ReceptionistDashboard';
import DoctorDashboard from './pages/admin/DoctorDashboard';
import MedicineManager from './pages/admin/MedicineManager';
import UserManager from './pages/admin/UserManager';
import QueueManager from './pages/admin/QueueManager';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import DoctorProfile from './pages/DoctorProfile';
import BookingPage from './pages/BookingPage';
import MyAppointments from './pages/MyAppointments';
import PatientProfile from './pages/PatientProfile';
import SearchPage from './pages/SearchPage';
import SpecialtyDoctorsPage from './pages/SpecialtyDoctorsPage';
import SpecialtiesPage from './pages/SpecialtiesPage';
import FavoriteDoctors from './pages/FavoriteDoctors';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      {/* Public / Patient Routes with Header & Footer */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/specialties" element={<SpecialtiesPage />} />
        <Route path="/specialty/:id" element={<SpecialtyDoctorsPage />} />
        <Route path="/doctor/:id" element={<DoctorProfile />} />
        <Route path="/login" element={user ? (['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(user.role) ? <Navigate to="/admin" /> : <Navigate to="/" />) : <Login />} />
        <Route path="/register" element={user ? (['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(user.role) ? <Navigate to="/admin" /> : <Navigate to="/" />) : <Register />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/my-appointments" element={<MyAppointments />} />
        <Route path="/favorites" element={user && user.role === 'PATIENT' ? <FavoriteDoctors /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <PatientProfile /> : <Navigate to="/login" />} />
      </Route>
      
      {/* Admin Protected routes */}
      <Route path="/admin" element={['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(user?.role) ? <AdminLayout /> : <Navigate to="/" />}>
        <Route index element={
          user?.role === 'RECEPTIONIST' ? <Navigate to="/admin/appointments" replace /> :
          user?.role === 'DOCTOR' ? <Navigate to="/admin/my-schedule" replace /> :
          <Dashboard />
        } />
        <Route path="specialties" element={<SpecialtyManager />} />
        <Route path="doctors" element={<DoctorManager />} />
        <Route path="schedules" element={<AdminSchedulePage />} />
        <Route path="appointments" element={<ReceptionistDashboard />} />
        <Route path="my-schedule" element={<DoctorDashboard tab="appointments" />} />
        <Route path="my-shifts" element={<DoctorDashboard tab="myShifts" />} />
        <Route path="open-shifts" element={<DoctorDashboard tab="openShifts" />} />
        <Route path="medicines" element={<MedicineManager />} />
        <Route path="users" element={<UserManager />} />
        <Route path="queue" element={<QueueManager />} />
      </Route>
    </Routes>
  );
}

export default App;
