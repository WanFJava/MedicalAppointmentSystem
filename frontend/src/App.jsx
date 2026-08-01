import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import SpecialtyManager from './pages/admin/SpecialtyManager';
import DoctorManager from './pages/admin/DoctorManager';
import ReceptionistDoctorManager from './pages/admin/ReceptionistDoctorManager';
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
import FeedbackManager from './pages/admin/FeedbackManager';
import LiveChatDashboard from './pages/admin/LiveChatDashboard';
import ComplaintManager from './pages/admin/ComplaintManager';
import PatientManager from './pages/admin/PatientManager';
import ReceptionistStats from './pages/admin/ReceptionistStats';

const RoleRoute = ({ user, roles, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!roles.includes(user.role)) {
    return <Navigate to={['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(user.role) ? '/admin' : '/'} replace />;
  }
  return children;
};

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
        <Route path="/book" element={<RoleRoute user={user} roles={['PATIENT']}><BookingPage /></RoleRoute>} />
        <Route path="/my-appointments" element={<RoleRoute user={user} roles={['PATIENT']}><MyAppointments /></RoleRoute>} />
        <Route path="/favorites" element={<RoleRoute user={user} roles={['PATIENT']}><FavoriteDoctors /></RoleRoute>} />
        <Route path="/profile" element={<RoleRoute user={user} roles={['PATIENT']}><PatientProfile /></RoleRoute>} />
      </Route>

      {/* Admin Protected routes */}
      <Route path="/admin" element={['ADMIN', 'RECEPTIONIST', 'DOCTOR'].includes(user?.role) ? <AdminLayout /> : <Navigate to="/" />}>
        <Route index element={
          user?.role === 'RECEPTIONIST' ? <ReceptionistStats /> :
          user?.role === 'DOCTOR' ? <Navigate to="/admin/my-schedule" replace /> :
          <Dashboard />
        } />
        <Route path="specialties" element={<RoleRoute user={user} roles={['ADMIN']}><SpecialtyManager /></RoleRoute>} />
        <Route path="doctors" element={<RoleRoute user={user} roles={['ADMIN', 'RECEPTIONIST']}>{user?.role === 'ADMIN' ? <DoctorManager /> : <ReceptionistDoctorManager />}</RoleRoute>} />
        <Route path="schedules" element={<RoleRoute user={user} roles={['ADMIN']}><AdminSchedulePage /></RoleRoute>} />
        <Route path="appointments" element={<RoleRoute user={user} roles={['ADMIN', 'RECEPTIONIST']}><ReceptionistDashboard /></RoleRoute>} />
        <Route path="live-chat" element={<RoleRoute user={user} roles={['ADMIN', 'RECEPTIONIST']}><LiveChatDashboard /></RoleRoute>} />
        <Route path="feedbacks" element={<RoleRoute user={user} roles={['ADMIN']}><FeedbackManager /></RoleRoute>} />
        <Route path="my-schedule" element={<RoleRoute user={user} roles={['DOCTOR']}><DoctorDashboard tab="appointments" /></RoleRoute>} />
        <Route path="my-shifts" element={<RoleRoute user={user} roles={['DOCTOR']}><DoctorDashboard tab="myShifts" /></RoleRoute>} />
        <Route path="open-shifts" element={<RoleRoute user={user} roles={['DOCTOR']}><DoctorDashboard tab="openShifts" /></RoleRoute>} />
        <Route path="medicines" element={<RoleRoute user={user} roles={['ADMIN']}><MedicineManager /></RoleRoute>} />
        <Route path="users" element={<RoleRoute user={user} roles={['ADMIN']}><UserManager /></RoleRoute>} />
        <Route path="queue" element={<RoleRoute user={user} roles={['RECEPTIONIST']}><QueueManager /></RoleRoute>} />
        <Route path="complaints" element={<RoleRoute user={user} roles={['ADMIN', 'RECEPTIONIST']}><ComplaintManager /></RoleRoute>} />
        <Route path="patients" element={<RoleRoute user={user} roles={['ADMIN', 'RECEPTIONIST']}><PatientManager /></RoleRoute>} />
      </Route>
    </Routes>
  );
}

export default App;
