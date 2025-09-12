import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';

export interface CalendarProps {
  mode?: 'single' | 'range' | 'multiple';
  selected?: Date | DateRange | Date[] | undefined;
  onSelect?: (date: Date | DateRange | Date[] | undefined) => void;
  defaultMonth?: Date;
  numberOfMonths?: number;
  initialFocus?: boolean;
  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({
  mode = 'single',
  selected,
  onSelect,
  defaultMonth = new Date(),
  numberOfMonths = 1,
  initialFocus = false,
  className = '',
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(defaultMonth);
  const [selectedDate, setSelectedDate] = useState<Date | DateRange | Date[] | undefined>(selected);

  useEffect(() => {
    setSelectedDate(selected);
  }, [selected]);

  const handleSelect = (date: Date | DateRange | Date[] | undefined) => {
    setSelectedDate(date);
    if (onSelect) onSelect(date);
  };

  // This is a simplified version. In a real application, you'd use a proper calendar library
  const renderDayPicker = () => {
    return (
      <div className="p-3">
        <div className="flex justify-between mb-4">
          <button 
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <span>←</span>
          </button>
          <div className="font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </div>
          <button 
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <span>→</span>
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center text-sm text-gray-500">{day}</div>
          ))}
        </div>
        
        {/* This is a simplified grid - a real implementation would calculate days properly */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, i) => {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i - currentMonth.getDay() + 1);
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isSelected = mode === 'single' && selectedDate instanceof Date 
              ? date.toDateString() === selectedDate.toDateString()
              : false;
              
            return (
              <button
                key={i}
                className={`p-2 text-center rounded-full ${
                  isCurrentMonth ? 'hover:bg-gray-100' : 'text-gray-300'
                } ${isSelected ? 'bg-blue-600 text-white' : ''}`}
                onClick={() => handleSelect(date)}
                disabled={!isCurrentMonth}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {renderDayPicker()}
    </div>
  );
};