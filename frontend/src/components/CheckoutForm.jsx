import React from 'react';
import { motion } from 'framer-motion';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CheckoutForm = ({ amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      // TODO: Call backend to create payment intent first
      // const { clientSecret } = await axios.post('http://localhost:5000/api/payments/create-intent', { amount });
      // Then confirm payment with Stripe
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5 }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    hover: {
      scale: 1.02,
      boxShadow: '0 10px 25px rgba(99, 102, 241, 0.3)',
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded shadow max-w-md mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h2 className="text-2xl font-bold mb-4" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        Payment Details
      </motion.h2>

      {error && (
        <motion.div
          className="mb-4 p-3 bg-red-100 text-red-700 rounded"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          {error}
        </motion.div>
      )}

      <motion.div className="p-3 border mb-4 rounded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <CardElement />
      </motion.div>

      <motion.button
        type="submit"
        disabled={!stripe || loading}
        variants={buttonVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        whileTap="tap"
        className="w-full bg-indigo-600 text-white py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        transition={{ delay: 0.3 }}
      >
        {loading ? 'Processing...' : `Pay $${amount}`}
      </motion.button>
    </motion.form>
  );
};
export default CheckoutForm;