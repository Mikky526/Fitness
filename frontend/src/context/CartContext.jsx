import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'fitness_cart';
const API = import.meta.env.VITE_API_URL || 'https://fitness-nmmf.onrender.com/api';

export const CartProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Load products from API on mount
  useEffect(() => {
    fetch(`${API}/products`)
      .then(r => r.json())
      .then(data => {
        // Normalise: use _id as the cart item id
        setProducts(Array.isArray(data) ? data.map(p => ({ ...p, id: p._id })) : []);
      })
      .catch(() => setProducts([]))
      .finally(() => setProductsLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product, qty = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { ...product, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQty = useCallback((id, qty) => {
    if (qty < 1) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  // Refresh products list (called after admin creates/edits/deletes a product)
  const refreshProducts = useCallback(() => {
    setProductsLoading(true);
    fetch(`${API}/products`)
      .then(r => r.json())
      .then(data => setProducts(Array.isArray(data) ? data.map(p => ({ ...p, id: p._id })) : []))
      .catch(() => {})
      .finally(() => setProductsLoading(false));
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      products, productsLoading, refreshProducts,
      items, addItem, removeItem, updateQty, clearCart,
      subtotal, tax, total, count,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
