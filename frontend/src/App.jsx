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

const Wrap = ({ children }) => (
  <div className="container mx-auto px-4 py-6">{children}</div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="min-h-screen bg-gray-50 text-gray-900">
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
