import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';

let stripePromise = null;

const PaymentPage = () => {
  const [ready, setReady] = useState(false);
  const [stripe, setStripe] = useState(null);

  useEffect(() => {
    if (import.meta.env.VITE_STRIPE_PUBLIC_KEY && window.Stripe) {
      const instance = window.Stripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
      setStripe(instance);
      stripePromise = Promise.resolve(instance);
      setReady(true);
    } else if (import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
      // Load Stripe.js dynamically
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        const instance = window.Stripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
        setStripe(instance);
        stripePromise = Promise.resolve(instance);
        setReady(true);
      };
      document.body.appendChild(script);
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
    return (
      <motion.div
        className="p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl max-w-md mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        ⚠️ Stripe public key not configured. Add VITE_STRIPE_PUBLIC_KEY to your .env.local file
      </motion.div>
    );
  }

  if (!ready) {
    return (
      <motion.div
        className="flex justify-center items-center min-h-screen bg-[#F8FAFC]"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-4xl"
        >
          💳
        </motion.div>
        <p className="ml-4 text-lg">Loading Stripe...</p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <Elements stripe={stripePromise}>
        <CheckoutForm appointmentId="123" amount={50} onSuccess={() => alert("Paid!")} />
      </Elements>
    </motion.div>
  );
};
export default PaymentPage;