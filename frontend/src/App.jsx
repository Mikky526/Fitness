import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import AIDietPlanner from './pages/AIDietPlanner';

const Wrap = ({ children }) => (
  <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">{children}</div>
);


function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen text-slate-900 app-page">
            <Navbar />
            <Routes>
              {/* Full-width pages */}
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Contained public */}
              <Route path="/" element={<Wrap><Home /></Wrap>} />

              {/* Member-only */}
              <Route path="/user/dashboard" element={
                <ProtectedRoute allowedRoles={['user']}>
                  <Wrap><UserDashboard /></Wrap>
                </ProtectedRoute>
              } />
              <Route path="/shop" element={
                <ProtectedRoute allowedRoles={['user']}>
                  <Wrap><ShopPage /></Wrap>
                </ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute allowedRoles={['user']}>
                  <Wrap><CartPage /></Wrap>
                </ProtectedRoute>
              } />

              <Route path="/diet-plan" element={
                <ProtectedRoute allowedRoles={['trainer', 'admin']}>
                  <Wrap><AIDietPlanner /></Wrap>
                </ProtectedRoute>
              } />

              {/* Trainer-only */}
              <Route path="/trainer/dashboard" element={
                <ProtectedRoute allowedRoles={['trainer']}>
                  <Wrap><TrainerDashboard /></Wrap>
                </ProtectedRoute>
              } />

              {/* Admin-only */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Wrap><AdminDashboard /></Wrap>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
