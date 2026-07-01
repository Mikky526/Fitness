import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import Cookies from 'js-cookie';
import { AuthContext } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'https://fitness-nmmf.onrender.com/api';

const Spinner = () => (
  <motion.div
    className="flex justify-center items-center min-h-screen"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
  >
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      className="text-4xl"
    >
      ⏳
    </motion.div>
    <p className="ml-4 text-lg">Loading...</p>
  </motion.div>
);

const ProtectedRoute = ({ children, allowedRoles, requirePurchase }) => {
  const { user, loading } = useContext(AuthContext);
  const [purchaseChecked, setPurchaseChecked] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    if (!requirePurchase || !user) return;
    const info = Cookies.get('userInfo');
    const token = info ? JSON.parse(info).token : null;
    axios
      .get(`${API}/payments/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setHasPurchased(!!data.hasPurchased))
      .catch(() => setHasPurchased(false))
      .finally(() => setPurchaseChecked(true));
  }, [requirePurchase, user]);

  if (loading) return <Spinner />;

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  if (requirePurchase) {
    if (!purchaseChecked) return <Spinner />;
    if (!hasPurchased) return <Navigate to="/shop" replace />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
};
export default ProtectedRoute;