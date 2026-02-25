import React from 'react';

const rulesData = [
  { range: '100%', status: 'Excellent Attendance', color: 'green' },
  { range: '95% – 99%', status: 'Very Good Attendance', color: 'green' },
  { range: '90% – 94%', status: 'Good Attendance', color: 'green' },
  { range: '85% – 89%', status: 'Satisfactory Attendance', color: 'yellow' },
  { range: '75% – 84%', status: 'Minimum Required Attendance', color: 'yellow' },
  { range: '65% – 74%', status: 'Condonation of Shortage', color: 'orange' },
  { range: '60% – 65%', status: 'Medical Condonation (Special)', color: 'orange' },
  { range: 'Below 65% (≤64%)', status: 'Detained / Not Eligible', color: 'red' },
  { range: 'Below 60%', status: 'Severe Shortage', color: 'red' },
];

const fullRemarks: Record<string, { action: string; remarks: string }> = {
    '100%': { action: '- No issue', remarks: '- Perfect record\n- Highly appreciated by college/university' },
    '95% – 99%': { action: '- No issue', remarks: '- Eligible for internal & exam benefits\n- Considered highly regular' },
    '90% – 94%': { action: '- No issue', remarks: '- Considered regular and punctual\n- No fine or condonation needed' },
    '85% – 89%': { action: '- No issue', remarks: '- Eligible for exams\n- Maintain consistency to avoid shortage' },
    '75% – 84%': { action: '- Allowed for exams', remarks: '- No condonation fee required\n- This is the cutoff for eligibility' },
    '65% – 74%': { action: '- Condonation applicable', remarks: '- Must pay ₹500–₹1000 to college\n- Required for exam eligibility\n- Called “Condonation Case”' },
    '60% – 65%': { action: '- Conditionally allowed', remarks: '- Must submit valid medical certificate\n- Payment may range ₹1000–₹2000\n- Allowed only in genuine medical emergencies' },
    'Below 65% (≤64%)': { action: '- Cannot write semester exams', remarks: '- Must repeat semester or re-register\n- No condonation allowed' },
    'Below 60%': { action: '- Not eligible for exams', remarks: '- Must repeat the entire semester\n- Attendance too low for condonation' },
};

const colorMap = {
    green: { web: 'text-green-400', print: 'text-black' },
    yellow: { web: 'text-yellow-400', print: 'text-black' },
    orange: { web: 'text-orange-400', print: 'text-black' },
    red: { web: 'text-red-400', print: 'text-black' },
};


const JntuhAttendanceRules: React.FC<{ forPrint?: boolean }> = ({ forPrint = false }) => {
    
    if (forPrint) {
        return (
            <div className="mt-4 border-t-2 border-black pt-2 break-inside-avoid">
                <h3 className="text-sm font-bold text-black mb-2 text-center">JNTUH Attendance Rules & Categories</h3>
                <table className="w-full text-[8px] border-collapse border border-black">
                    <thead className="bg-gray-100 font-bold">
                        <tr>
                            <th className="p-1 border border-black w-[15%]">Attendance % Range</th>
                            <th className="p-1 border border-black w-[20%]">Status / Category</th>
                            <th className="p-1 border border-black w-[20%]">Condonation / Action</th>
                            <th className="p-1 border border-black w-[45%]">Remarks / Payment / Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rulesData.map((rule, index) => (
                            <tr key={index}>
                                <td className="p-1 border border-black font-semibold text-center">{rule.range}</td>
                                <td className="p-1 border border-black">{rule.status}</td>
                                <td className="p-1 border border-black">{fullRemarks[rule.range].action}</td>
                                <td className="p-1 border border-black whitespace-pre-wrap">{fullRemarks[rule.range].remarks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 <div className="text-[7px] text-gray-700 mt-1 text-center">
                    <span className="font-bold">Legend:</span> Excellent, Minimum, Condonation, Detained
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 p-6 rounded-xl shadow-lg border border-slate-700 mt-6">
            <h3 className="text-xl font-bold text-blue-400 mb-4">JNTUH Attendance Rules & Categories</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-700">
                        <tr>
                            <th className="py-2 px-3 text-left font-semibold text-slate-300">Attendance % Range</th>
                            <th className="py-2 px-3 text-left font-semibold text-slate-300">Status / Category</th>
                            <th className="py-2 px-3 text-left font-semibold text-slate-300">Condonation / Action</th>
                            <th className="py-2 px-3 text-left font-semibold text-slate-300">Remarks / Payment / Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {rulesData.map((rule, index) => (
                            <tr key={index} className="text-slate-400">
                                <td className="py-3 px-3 font-semibold text-slate-200">{rule.range}</td>
                                <td className="py-3 px-3"><span className={`font-medium ${colorMap[rule.color as keyof typeof colorMap].web}`}>{rule.status}</span></td>
                                <td className="py-3 px-3">{fullRemarks[rule.range].action}</td>
                                <td className="py-3 px-3 whitespace-pre-line text-xs leading-5">{fullRemarks[rule.range].remarks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-700">
                <span className="font-bold text-green-400">Green</span> = Excellent, <span className="font-bold text-yellow-400">Yellow</span> = Minimum, <span className="font-bold text-orange-400">Orange</span> = Condonation, <span className="font-bold text-red-400">Red</span> = Detained
            </div>
        </div>
    );
};

export default JntuhAttendanceRules;