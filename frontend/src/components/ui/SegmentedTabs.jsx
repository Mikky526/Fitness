import React from 'react';
import { motion } from 'framer-motion';

const SegmentedTabs = ({
  tabs,
  activeKey,
  onChange,
  layoutId,
  containerClassName = '',
  activeTextClass = 'text-white',
  inactiveTextClass = 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl',
  activeBgClass = 'bg-[#36a8cd] rounded-xl shadow-md',
  buttonClassName = '',
  renderTrailing,
}) => (
  <div className={containerClassName}>
    {tabs.map((tab) => (
      <motion.button
        key={tab.key}
        onClick={() => onChange(tab.key)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        className={`relative flex items-center gap-2 px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-1 justify-center ${
          activeKey === tab.key ? activeTextClass : inactiveTextClass
        } ${buttonClassName}`}
      >
        {activeKey === tab.key && (
          <motion.div
            layoutId={layoutId}
            className={`absolute inset-0 ${activeBgClass}`}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          />
        )}
        <span className="relative z-10">{tab.icon}</span>
        <span className="relative z-10">{tab.label}</span>
        {renderTrailing ? renderTrailing(tab) : null}
      </motion.button>
    ))}
  </div>
);

export default SegmentedTabs;
