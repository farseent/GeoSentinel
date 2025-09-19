// src/components/map/DateRangePicker.jsx
import React, { useState } from 'react';

const DateRangePicker = ({ value, onChange, disabled = false }) => {
  const [errors, setErrors] = useState({});

  // Get today's date for max date restriction
  const today = new Date().toISOString().split('T')[0];
  
  // Get date 5 years ago for min date restriction
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  const minDate = fiveYearsAgo.toISOString().split('T')[0];

  const validateDates = (startDate, endDate) => {
    const newErrors = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (start > end) {
        newErrors.dateOrder = 'Start date must be before end date';
      } else if (diffDays > 365) {
        newErrors.dateRange = 'Date range cannot exceed 365 days';
      } else if (diffDays < 1) {
        newErrors.dateRange = 'Date range must be at least 1 day';
      }
    }

    if (startDate) {
      const start = new Date(startDate);
      const today = new Date();
      if (start > today) {
        newErrors.futureDate = 'Start date cannot be in the future';
      }
    }

    if (endDate) {
      const end = new Date(endDate);
      const today = new Date();
      if (end > today) {
        newErrors.futureDate = 'End date cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartDateChange = (e) => {
    const startDate = e.target.value;
    const newValue = { ...value, startDate };
    
    if (validateDates(startDate, value.endDate)) {
      onChange(newValue);
    } else {
      onChange(newValue); // Still update to show the value, but validation errors will be shown
    }
  };

  const handleEndDateChange = (e) => {
    const endDate = e.target.value;
    const newValue = { ...value, endDate };
    
    if (validateDates(value.startDate, endDate)) {
      onChange(newValue);
    } else {
      onChange(newValue); // Still update to show the value, but validation errors will be shown
    }
  };

  const getDateRangeInfo = () => {
    if (!value.startDate || !value.endDate) return null;
    
    const start = new Date(value.startDate);
    const end = new Date(value.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      days: diffDays,
      isValid: Object.keys(errors).length === 0
    };
  };

  const dateRangeInfo = getDateRangeInfo();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        Date Range Selection
      </h3>

      {/* Start Date */}
      <div>
        <label htmlFor="start-date" className="block text-xs text-gray-600 mb-1">
          Start Date
        </label>
        <input
          id="start-date"
          type="date"
          value={value.startDate}
          onChange={handleStartDateChange}
          min={minDate}
          max={today}
          disabled={disabled}
          className={`w-full text-sm border rounded px-3 py-2 focus:outline-none focus:ring-2 transition-colors ${
            disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
              : errors.dateOrder || errors.futureDate
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
      </div>

      {/* End Date */}
      <div>
        <label htmlFor="end-date" className="block text-xs text-gray-600 mb-1">
          End Date
        </label>
        <input
          id="end-date"
          type="date"
          value={value.endDate}
          onChange={handleEndDateChange}
          min={value.startDate || minDate}
          max={today}
          disabled={disabled}
          className={`w-full text-sm border rounded px-3 py-2 focus:outline-none focus:ring-2 transition-colors ${
            disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
              : errors.dateOrder || errors.futureDate
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
      </div>

      {/* Quick Date Range Buttons */}
      {!disabled && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setMonth(start.getMonth() - 1);
              
              const newValue = {
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0]
              };
              onChange(newValue);
            }}
            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
          >
            Last Month
          </button>
          <button
            type="button"
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setMonth(start.getMonth() - 3);
              
              const newValue = {
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0]
              };
              onChange(newValue);
            }}
            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
          >
            Last 3 Months
          </button>
          <button
            type="button"
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setMonth(start.getMonth() - 6);
              
              const newValue = {
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0]
              };
              onChange(newValue);
            }}
            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
          >
            Last 6 Months
          </button>
          <button
            type="button"
            onClick={() => {
              const end = new Date();
              const start = new Date();
              start.setFullYear(start.getFullYear() - 1);
              
              const newValue = {
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0]
              };
              onChange(newValue);
            }}
            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
          >
            Last Year
          </button>
        </div>
      )}

      {/* Date Range Information */}
      {dateRangeInfo && (
        <div className={`p-3 rounded text-xs ${
          dateRangeInfo.isValid 
            ? 'bg-green-50 text-green-700' 
            : 'bg-yellow-50 text-yellow-700'
        }`}>
          <div className="font-medium mb-1">
            Selected Range: {dateRangeInfo.days} {dateRangeInfo.days === 1 ? 'day' : 'days'}
          </div>
          {dateRangeInfo.isValid ? (
            <div>✓ Valid date range selected</div>
          ) : (
            <div>⚠ Please review date selection</div>
          )}
        </div>
      )}

      {/* Error Messages */}
      {Object.keys(errors).length > 0 && (
        <div className="space-y-1">
          {Object.values(errors).map((error, index) => (
            <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Disabled State Message */}
      {disabled && (
        <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
          Please log in to select date ranges
        </div>
      )}

      {/* Info Box */}
      {/* <div className="p-2 bg-blue-50 rounded text-xs text-blue-600">
        <div className="font-medium mb-1">ℹ️ Date Range Guidelines</div>
        <ul className="space-y-1">
          <li>• Maximum range: 365 days</li>
          <li>• Historical data available from {minDate}</li>
          <li>• Shorter ranges process faster</li>
          <li>• Future dates not supported</li>
        </ul>
      </div> */}
    </div>
  );
};

export default DateRangePicker;