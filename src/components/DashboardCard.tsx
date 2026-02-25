import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<{ className?: string }>;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'indigo';
}

const colorStyles = {
  blue: { border: 'border-blue-500', bg: 'bg-blue-500/20', text: 'text-blue-400' },
  green: { border: 'border-green-500', bg: 'bg-green-500/20', text: 'text-green-400' },
  red: { border: 'border-red-500', bg: 'bg-red-500/20', text: 'text-red-400' },
  yellow: { border: 'border-yellow-500', bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  indigo: { border: 'border-indigo-500', bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
};


const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, color }) => {
  const styles = colorStyles[color];

  return (
    <div className={`bg-slate-800 p-4 rounded-lg shadow-lg border-t-4 ${styles.border}`}>
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-400 font-medium">{title}</p>
        <div className={`p-2 rounded-full ${styles.bg}`}>
          {React.cloneElement(icon, { className: `h-5 w-5 ${styles.text}` })}
        </div>
      </div>
      <p className="text-4xl font-bold text-white mt-2">{value}</p>
    </div>
  );
};

export default DashboardCard;
