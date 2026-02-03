import React from 'react';

/**
 * ColorPicker Component
 * Simple color picker using browser's native color input
 */
const ColorPicker = ({ color, onChange, disabled }) => {
  const handleColorChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Color Preview with Native Picker */}
      <div className="relative group">
        <input
          type="color"
          value={color}
          onChange={handleColorChange}
          disabled={disabled}
          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          title="Click to choose color"
        />
        <div
          className="w-12 h-12 rounded-md border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
          style={{ backgroundColor: color }}
          title="Click to choose color"
        />
      </div>

      {/* Color Value Display */}
      <input
        type="text"
        value={color}
        onChange={(e) => {
          const value = e.target.value;
          if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
            onChange(value);
          }
        }}
        disabled={disabled}
        placeholder="#000000"
        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm uppercase font-mono disabled:opacity-50 disabled:cursor-not-allowed"
        maxLength={7}
      />
    </div>
  );
};

export default ColorPicker;