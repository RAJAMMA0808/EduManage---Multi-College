
import React, { useState, useMemo, useEffect } from 'react';
import { User, College, Role, StudentFee, StudentDetailsType } from '../types/index';
import { MenuIcon, CurrencyDollarIcon, CreditCardIcon, DocumentIcon, CheckCircleIcon, AcademicCapIcon, BuildingOfficeIcon } from './icons';
import { COLLEGE_NAMES, DEPARTMENTS, FEE_STRUCTURE, COLLEGE_CODES } from '../constants/index';
import { addStudentFee, getStudentDetails, getSubjects } from '../services/api';

interface OnlineFeePaymentProps {
    user: User;
    onToggleSidebar: () => void;
}

const commonInputClass = "bg-slate-800 border border-slate-700 text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:bg-slate-700 disabled:text-slate-400 transition-colors";
const commonSelectClass = "bg-slate-800 border border-slate-700 text-white text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:bg-slate-700 disabled:text-slate-400 transition-colors";
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const BANK_LIST = [
  'State Bank of India (SBI)',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'IndusInd Bank'
];

const ACCOUNT_DETAILS: Record<string, { holder: string; number: string; ifsc: string }> = {
    [College.KNRR]: { holder: 'Mr. BHUKYA DHARMA', number: '0000002017695****', ifsc: 'SBIN0015612' },
    [College.BRIL]: { holder: 'BRILLIANT GRP INST', number: '0000003028714****', ifsc: 'HDFC0001234' },
    [College.BRIG]: { holder: 'BRILLIANT GRP INST', number: '0000003028714****', ifsc: 'HDFC0001234' },
};

/**
 * IMPORTANT DISCLAIMER:
 * ------------------------------------------------
 * This mapping is a CLIENT-SIDE SIMULATION.
 * Card numbers alone cannot reliably determine
 * whether a card is Credit or Debit in the real world (especially for Visa/Mastercard).
 *
 * These mappings are intentionally hardcoded to:
 * - Demonstrate validation logic
 * - Prevent known incorrect combinations in demo/testing
 *
 * Real card type verification MUST be done
 * via a payment gateway (Razorpay / Stripe / PayU).
 * 
 * This application performs client-side validation and simulation.
 * Real credit/debit classification and card verification happen only via payment gateways.
 */

// --- BIN (Bank Identification Number) Mapping ---
// IMPORTANT: Simulation only
const BANK_BIN_MAP: Record<string, string> = {
  /* ================= SBI ================= */
  "5040": "State Bank of India (SBI)", // Maestro
  "6220": "State Bank of India (SBI)", // Maestro
  "8174": "State Bank of India (SBI)", // RuPay
  "6521": "State Bank of India (SBI)", // RuPay
  "5899": "State Bank of India (SBI)", // Visa Credit
  "4334": "State Bank of India (SBI)", // Visa Credit
  "5048": "State Bank of India (SBI)", // MasterCard Debit

  /* ================= HDFC ================= */
  "4160": "HDFC Bank", // Visa Debit
  "4400": "HDFC Bank", // Visa Credit
  "4378": "HDFC Bank", // Mastercard Credit
  "5499": "HDFC Bank", // Mastercard Credit
  "6522": "HDFC Bank", // RuPay Debit
  "6079": "HDFC Bank", // RuPay Credit

  /* ================= ICICI ================= */
  "4020": "ICICI Bank", // Visa Credit
  "4375": "ICICI Bank", // Visa Credit
  "4477": "ICICI Bank", // Visa Credit
  "5081": "ICICI Bank", // Maestro Debit
  "5179": "ICICI Bank", // Mastercard Credit
  "6523": "ICICI Bank", // RuPay Debit
  "4629": "ICICI Bank", // Visa Debit
  "4035": "ICICI Bank", // Visa Credit (Coral)

  /* ================= AXIS ================= */
  "4148": "Axis Bank", // Visa Debit
  "4213": "Axis Bank", // Visa Credit
  "5318": "Axis Bank", // Mastercard Credit
  "5244": "Axis Bank", // Mastercard Credit
  "6524": "Axis Bank", // RuPay Debit

  /* ================= KOTAK ================= */
  "4594": "Kotak Mahindra Bank", // Visa Debit
  "4595": "Kotak Mahindra Bank", // Visa Debit
  "4896": "Kotak Mahindra Bank", // Visa Credit
  "5129": "Kotak Mahindra Bank", // Mastercard Credit
  "6525": "Kotak Mahindra Bank", // RuPay Debit
  "4166": "Kotak Mahindra Bank", // Visa Credit

  /* ================= PNB ================= */
  "6070": "Punjab National Bank", // RuPay Debit
  "5085": "Punjab National Bank", // Maestro Debit
  "5213": "Punjab National Bank", // Mastercard Credit
  "5286": "Punjab National Bank", // Mastercard Credit

  /* ================= BANK OF BARODA ================= */
  "5087": "Bank of Baroda", // Maestro Debit
  "4189": "Bank of Baroda", // Visa Debit
  "5296": "Bank of Baroda", // Mastercard Credit
  "6526": "Bank of Baroda", // RuPay Debit

  /* ================= CANARA ================= */
  "5089": "Canara Bank", // Maestro Debit
  "4214": "Canara Bank", // Visa Debit
  "5326": "Canara Bank", // Mastercard Credit
  "6527": "Canara Bank", // RuPay Debit

  /* ================= UNION BANK ================= */
  "5086": "Union Bank of India", // Maestro Debit
  "4215": "Union Bank of India", // Visa Debit
  "5295": "Union Bank of India", // Mastercard Credit
  "6528": "Union Bank of India", // RuPay Debit

  /* ================= INDUSIND ================= */
  "5120": "IndusInd Bank", // Mastercard Credit
  "4167": "IndusInd Bank", // Visa Debit
  "6529": "IndusInd Bank", // RuPay Debit
  "4147": "IndusInd Bank", // Visa Credit (Legend) - Corrected from SBI
};

// --- BIN TYPE MAP (Simulation ONLY) ---
const BIN_TYPE_MAP: Record<string, 'Credit Card' | 'Debit Card'> = {
  /* ======= DEBIT ======= */
  "4160": "Debit Card", // HDFC Visa
  "4214": "Debit Card", // Canara Visa
  "4215": "Debit Card", // Union Visa
  "4594": "Debit Card", // Kotak Visa
  "4595": "Debit Card", // Kotak Visa
  "5081": "Debit Card", // ICICI Maestro
  "5085": "Debit Card", // PNB Maestro
  "5086": "Debit Card", // Union Maestro
  "5087": "Debit Card", // BOB Maestro
  "5089": "Debit Card", // Canara Maestro
  "5040": "Debit Card", // SBI Maestro
  "6220": "Debit Card", // SBI Maestro
  "8174": "Debit Card", // RuPay
  "6521": "Debit Card",
  "6522": "Debit Card",
  "6523": "Debit Card",
  "6524": "Debit Card",
  "6525": "Debit Card",
  "6526": "Debit Card",
  "6527": "Debit Card",
  "6528": "Debit Card",
  "6529": "Debit Card",
  "4148": "Debit Card", // Axis Visa
  "4167": "Debit Card", // IndusInd Visa
  "4189": "Debit Card", // BOB Visa
  "5048": "Debit Card", // SBI MasterCard
  "4629": "Debit Card", // ICICI Visa

  /* ======= CREDIT ======= */
  "4400": "Credit Card", // HDFC Visa
  "4375": "Credit Card", // ICICI Visa
  "4477": "Credit Card", // ICICI Visa
  "4020": "Credit Card", // ICICI Visa
  "4213": "Credit Card", // Axis Visa
  "4035": "Credit Card", // ICICI Visa
  "4896": "Credit Card", // Kotak Visa
  "5120": "Credit Card", // IndusInd MC
  "5179": "Credit Card", // ICICI MC
  "5213": "Credit Card", // PNB MC
  "5244": "Credit Card", // Axis MC
  "5295": "Credit Card", // Union MC
  "5296": "Credit Card", // BOB MC
  "5326": "Credit Card", // Canara MC
  "5318": "Credit Card", // Axis MC
  "5899": "Credit Card", // SBI Visa
  "4334": "Credit Card", // SBI Visa
  "4378": "Credit Card", // HDFC MC
  "5499": "Credit Card", // HDFC MC
  "5129": "Credit Card", // Kotak MC
  "5286": "Credit Card", // PNB MC
  "4166": "Credit Card", // Kotak Visa
  "6079": "Credit Card", // HDFC RuPay
  "4147": "Credit Card", // IndusInd Legend - Corrected from Debit
};

// --- Blocked Card Numbers (Simulation for 'Declined' transactions) ---
const BLOCKED_TEST_CARDS = new Set<string>([
    "1111222233334444", 
    "0000000000000000",
    "1234567890123456",
    "4242424242424241",
    "4594590000669162" // Incorrect Kotak Card (Double 66)
]);

// Helper to normalize bank names for comparison (removes spaces, case-insensitive)
const normalizeBankName = (name: string) => name.toLowerCase().replace(/[\s\(\)]/g, "");


// Luhn Algorithm to validate Credit/Debit Card Numbers
const isValidCardNumber = (val: string) => {
    // Remove all non-digits
    const num = val.replace(/\D/g, '');
    if (!num) return false;
    
    let sum = 0;
    let shouldDouble = false;
    // Loop through values starting at the rightmost side
    for (let i = num.length - 1; i >= 0; i--) {
        let digit = parseInt(num.charAt(i));

        if (shouldDouble) {
            if ((digit *= 2) > 9) digit -= 9;
        }

        sum += digit;
        shouldDouble = !shouldDouble;
    }
    return (sum % 10) === 0;
};

const isValidExpiry = (expiry: string) => {
    // Format Check MM/YY
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return false;
    
    const [mmStr, yyStr] = expiry.split('/');
    const mm = parseInt(mmStr, 10);
    const yy = parseInt(yyStr, 10);

    // Month Logic
    if (mm < 1 || mm > 12) return false;

    // Year Logic (Future Check)
    const now = new Date();
    const currentYear = parseInt(now.getFullYear().toString().slice(-2)); // e.g., 25
    const currentMonth = now.getMonth() + 1; // 1-12

    if (yy < currentYear) return false; // Past year
    if (yy === currentYear && mm < currentMonth) return false; // Past month in current year

    return true;
};

const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidMobile = (mobile: string) => {
    return /^[6-9]\d{9}$/.test(mobile);
};

// SAFE DETECTION FUNCTION (MANDATORY)
const getDetectedCardType = (cardNumber: string): 'Debit Card' | 'Credit Card' | 'Unknown' => {
  const num = cardNumber.replace(/\D/g, '');

  const prefixes = Object.keys(BIN_TYPE_MAP)
    .sort((a, b) => b.length - a.length);

  for (const prefix of prefixes) {
    if (num.startsWith(prefix)) {
      return BIN_TYPE_MAP[prefix];
    }
  }

  // Fallback patterns for unknown BINs (Generic heuristics)
  if (/^(60|65|81|82|508)/.test(num)) return 'Debit Card'; // RuPay
  if (/^(50|5[6-9]|6\d)/.test(num)) return 'Debit Card'; // Maestro

  return 'Unknown';
};

// Deep Bank Detection based on BIN (Robust Length Check)
const getDetectedBank = (cardNumber: string): string | null => {
    const num = cardNumber.replace(/\D/g, '');
    if (num.length < 4) return null;

    // Match longest BIN first (6 -> 5 -> 4) to ensure specificity
    const binLengths = [6, 5, 4];
    
    // Check against map using sorted lengths
    for (const len of binLengths) {
        if (num.length >= len) {
            const bin = num.substring(0, len);
            if (BANK_BIN_MAP[bin]) {
                return BANK_BIN_MAP[bin];
            }
        }
    }
    
    return null; // Unknown
};


const Field: React.FC<{ label: string; children: React.ReactNode; desc?: string; error?: string }> = ({ label, children, desc, error }) => (
    <div>
        <label className="block mb-1.5 text-sm font-medium text-slate-300">{label}</label>
        {children}
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        {desc && !error && <p className="mt-1 text-xs text-slate-500">{desc}</p>}
    </div>
);

const OnlineFeePayment: React.FC<OnlineFeePaymentProps> = ({ user, onToggleSidebar }) => {
    // Only Chairman defaults to BRIL, others default to their assigned college
    const initialCollege = user.role === Role.CHAIRMAN ? College.BRIL : (user.college || College.KNRR);
    const [selectedCollege, setSelectedCollege] = useState<College>(initialCollege);
    const [activeTab, setActiveTab] = useState<'tuition' | 'exam'>('tuition');
    
    // Update selectedCollege if user prop changes (e.g. login/logout)
    useEffect(() => {
        if (user.role !== Role.CHAIRMAN && user.college) {
            setSelectedCollege(user.college);
        }
    }, [user]);
    
    const getProgramFromId = (id: string) => {
        const match = id.match(/^[A-Z]([A-Z]{2,4})\d+/);
        return match ? match[1] : 'CSE';
    };

    const isStudent = user.role === Role.STUDENT;
    const initialProgram = isStudent ? getProgramFromId(user.id) : 'CSE';

    const [formData, setFormData] = useState({
        admissionNumber: isStudent ? user.id : '',
        admissionType: 'Counselling Seat/Scholarship/Sports Quota',
        programCode: initialProgram,
        semester: '1',
        academicYear: '',
        paymentDate: formatDate(new Date()),
        totalFees: String(FEE_STRUCTURE[initialProgram] || ''),
        previousPaidAmount: '0',
        gender: 'M',
        // Exam Fee Specifics
        lateFee: '0',
        examFeeTotal: '0'
    });

    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
    const [isAllSubjects, setIsAllSubjects] = useState(false);

    const [studentName, setStudentName] = useState('');
    const [studentNotFoundError, setStudentNotFoundError] = useState('');
    const [isPaymentSectionOpen, setIsPaymentSectionOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('Debit Card');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fetchedStudentData, setFetchedStudentData] = useState<StudentDetailsType | null>(null);

    // Payment Amount State
    const [paymentAmount, setPaymentAmount] = useState('');

    // Card/Check Details State
    const [cardDetails, setCardDetails] = useState({ 
        bankName: '', 
        holderName: '', 
        cardNumber: '', 
        expiry: '', 
        cvv: '', 
        mobile: '', 
        email: '', 
        address: '' 
    });
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [checkDetails, setCheckDetails] = useState({ bankName: '', instrumentNumber: '', issueDate: '', branchName: '' });

    const [debouncedAdmissionNumber, setDebouncedAdmissionNumber] = useState(formData.admissionNumber);

    // Debounce Admission Number
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedAdmissionNumber(formData.admissionNumber); }, 500);
        return () => clearTimeout(handler);
    }, [formData.admissionNumber]);

    // 1. Fetch Student Basic Info
    useEffect(() => {
        const admNo = isStudent ? user.id : debouncedAdmissionNumber;
        if (!admNo) {
            setStudentName('');
            setStudentNotFoundError('');
            setFetchedStudentData(null);
            return;
        }

        const fetchStudentInfo = async () => {
            setIsLoading(true);
            try {
                const details = await getStudentDetails(admNo);
                if (details) {
                    setFetchedStudentData(details);
                    setStudentName(details.studentName);
                    setFormData(prev => ({ 
                        ...prev, 
                        programCode: details.programCode,
                        gender: details.gender, 
                        totalFees: String(FEE_STRUCTURE[details.programCode] || prev.totalFees)
                    }));
                    // FIX: Auto-select college based on student details
                    if (details.collegeCode && user.role === Role.CHAIRMAN) {
                        setSelectedCollege(details.collegeCode);
                    }
                    
                    setStudentNotFoundError('');
                    setCardDetails(prev => ({ 
                        ...prev, 
                        holderName: '', // IMPORTANT: Do not auto-fill card holder name. It might be a parent.
                        mobile: details.mobileNumber?.replace('+91', '') || '', 
                        email: `${details.admissionNumber.toLowerCase()}@student.edu` 
                    }));
                } else {
                    setFetchedStudentData(null);
                    setStudentName('');
                    setStudentNotFoundError('Student not found in database.');
                }
            } catch (e) {
                console.error("Error fetching student:", e);
                setStudentNotFoundError('Error fetching details.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchStudentInfo();
    }, [debouncedAdmissionNumber, user, isStudent]);

    // 2. Fetch Subjects for Exam Fee
    useEffect(() => {
        const fetchSubs = async () => {
            if (activeTab === 'exam' && formData.programCode && formData.semester) {
                const subs = await getSubjects(selectedCollege, formData.programCode, formData.semester);
                setAvailableSubjects(subs);
                setSelectedSubjects([]);
                setIsAllSubjects(false);
            }
        };
        fetchSubs();
    }, [activeTab, formData.programCode, formData.semester, selectedCollege]);

    // 3. Calculate Tuition Fee History
    useEffect(() => {
        if (activeTab === 'tuition' && fetchedStudentData && formData.academicYear) {
            // Filter only Tuition fees
            const yearFees = fetchedStudentData.fees.filter(f => f.academicYear === formData.academicYear && (f.feeType === 'Tuition' || !f.feeType));
            const historicalPaid = yearFees.reduce((sum, f) => sum + f.paidAmount, 0);
            const recordTotalFee = yearFees.length > 0 ? yearFees[0].totalFees : (FEE_STRUCTURE[formData.programCode] || 0);
            
            setFormData(prev => ({
                ...prev,
                totalFees: String(recordTotalFee),
                previousPaidAmount: String(historicalPaid),
            }));
        }
    }, [activeTab, fetchedStudentData, formData.academicYear, formData.programCode]);

    // 4. Calculate Exam Fees
    useEffect(() => {
        if (activeTab === 'exam') {
            let baseFee = 0;
            const subjectCount = isAllSubjects ? 4 : selectedSubjects.length; 
            if (subjectCount === 0) baseFee = 0;
            else if (subjectCount === 1) baseFee = 360;
            else if (subjectCount === 2) baseFee = 460;
            else if (subjectCount === 3) baseFee = 560;
            else baseFee = 760;

            const late = parseInt(formData.lateFee) || 0;
            setFormData(prev => ({ ...prev, examFeeTotal: String(baseFee + late) }));
            setPaymentAmount(String(baseFee + late)); // Auto-set payment amount for exam
        }
    }, [selectedSubjects, isAllSubjects, formData.lateFee, activeTab]);


    const { remainingDue } = useMemo(() => {
        const total = Math.round(parseFloat(formData.totalFees)) || 0;
        const paid = Math.round(parseFloat(formData.previousPaidAmount)) || 0;
        const due = total - paid;
        return { remainingDue: due < 0 ? 0 : due };
    }, [formData.totalFees, formData.previousPaidAmount]);

    const derivedAcademicYears = useMemo(() => {
        if (!formData.admissionNumber) return [];
        const admissionYearMatch = formData.admissionNumber.match(/[a-zA-Z]+(\d{4})/);
        if (!admissionYearMatch) return [];
        const startYear = parseInt(admissionYearMatch[1], 10);
        return Array.from({ length: 4 }, (_, i) => `${startYear + i}-${startYear + i + 1}`);
    }, [formData.admissionNumber]);

    const handleSubjectChange = (subject: string) => {
        if (isAllSubjects) setIsAllSubjects(false);
        setSelectedSubjects(prev => prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]);
    };

    const handleReset = () => {
        const resetProgram = isStudent ? getProgramFromId(user.id) : 'CSE';
        setFormData({ ...formData, admissionNumber: isStudent ? user.id : '', programCode: resetProgram, gender: 'M', paymentDate: formatDate(new Date()) });
        setPaymentAmount('');
        setIsPaymentSectionOpen(false);
        setSelectedSubjects([]);
        setIsAllSubjects(false);
        setCardDetails({ bankName: '', holderName: '', cardNumber: '', expiry: '', cvv: '', mobile: '', email: '', address: '' });
        setFieldErrors({});
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const validateField = (field: string, value: string) => {
        let err = '';
        if (field === 'cardNumber') {
            if (!isValidCardNumber(value)) err = 'Invalid Card Number.';
        } else if (field === 'expiry') {
            if (!isValidExpiry(value)) err = 'Card Expired or Invalid.';
        } else if (field === 'cvv') {
            if (!/^\d{3,4}$/.test(value)) err = 'Invalid CVV.';
        }
        setFieldErrors(prev => ({ ...prev, [field]: err }));
        return !err;
    };

    const handleSubmit = async () => {
        setError('');
        // FIX: Round to integer to prevent float truncation issues in DB (short by 1 error)
        const amountToPay = Math.round(parseFloat(paymentAmount));
        
        if (isNaN(amountToPay) || amountToPay <= 0) {
             setError("Please enter a valid payment amount.");
             return;
        }

        if (activeTab === 'tuition' && amountToPay > remainingDue) {
             setError(`Payment amount cannot exceed the remaining due of ₹${remainingDue.toLocaleString('en-IN')}.`);
             return;
        }

        if (['Debit Card', 'Credit Card'].includes(paymentMethod)) {
            // STRICT BANK VERIFICATION
            if (!cardDetails.bankName || cardDetails.bankName === "") {
                setError("Please select the Bank Name associated with your card.");
                return;
            }
            
            // Strict Validation Check
            const isCardValid = validateField('cardNumber', cardDetails.cardNumber);
            const isExpiryValid = validateField('expiry', cardDetails.expiry);
            const isCvvValid = validateField('cvv', cardDetails.cvv);

            if (!isCardValid || !isExpiryValid || !isCvvValid) {
                setError("Please correct the errors in the card details.");
                return;
            }

            const cleanNum = cardDetails.cardNumber.replace(/\D/g, '');

            // *** STRICT CARD TYPE CHECK (Enhanced for Credit/Debit mismatch) ***
            const detectedType = getDetectedCardType(cardDetails.cardNumber);
            
            // 1. Credit Card Selected but Debit Card Detected
            if (paymentMethod === 'Credit Card' && detectedType === 'Debit Card') {
                setError("Invalid Card Type: This appears to be a Debit Card (RuPay/Maestro/Kotak). Please change the Payment Method to 'Debit Card' or use a valid Credit Card.");
                return;
            }

            // 2. Debit Card Selected but Credit Card Detected (Simulation Strictness)
            if (paymentMethod === 'Debit Card' && detectedType === 'Credit Card') {
                setError("Invalid Card Type: This appears to be a Credit Card. Please change the Payment Method to 'Credit Card'.");
                return;
            }

            // *** DEEP BANK MATCHING CHECK (BIN Based) ***
            const detectedBank = getDetectedBank(cardDetails.cardNumber);
            if (detectedBank) {
                 if (normalizeBankName(detectedBank) !== normalizeBankName(cardDetails.bankName)) {
                     setError(`Invalid Bank: The card number seems to belong to ${detectedBank}, but you selected ${cardDetails.bankName}.`);
                     return;
                 }
            } else {
                 // Warning for unknown BINs if needed
                 // For now, if we can't identify the bank, we let it pass if basic validation passes, 
                 // BUT strict checking for test cards assumes we know the BINs.
            }

            // *** DEEP SIMULATION CHECK - Known Invalid Cards ***
            if (BLOCKED_TEST_CARDS.has(cleanNum)) {
                 setError("Transaction Declined: Invalid Card Number (Simulated Bank Rejection). Please verify digits.");
                 return;
            }

            if (cardDetails.email && !isValidEmail(cardDetails.email)) {
                setError("Invalid Email Address format.");
                return;
            }
            if (cardDetails.mobile && !isValidMobile(cardDetails.mobile)) {
                setError("Invalid Mobile Number. Must be 10 digits.");
                return;
            }
        }

        try {
            const feeType = activeTab === 'tuition' ? 'Tuition' : 'Exam';
            
            let newDueAmount = 0;
            let status: 'Paid' | 'Partial' | 'Due' = 'Paid';
            let totalFees = amountToPay; 

            if (activeTab === 'tuition') {
                const newTotalPaid = Math.round(parseFloat(formData.previousPaidAmount)) + amountToPay;
                const totalFeeInt = Math.round(parseFloat(formData.totalFees));
                newDueAmount = Math.max(0, totalFeeInt - newTotalPaid);
                totalFees = totalFeeInt;
                status = newDueAmount <= 0 ? 'Paid' : 'Partial';
            } else {
                const totalExamFee = Math.round(parseFloat(formData.examFeeTotal));
                if (amountToPay < totalExamFee) {
                    newDueAmount = totalExamFee - amountToPay;
                    status = 'Partial';
                }
                totalFees = totalExamFee;
            }

            // Combine Date Input with Current Time for Precision
            const now = new Date();
            const [y, m, d] = formData.paymentDate.split('-').map(Number);
            const paymentTimestamp = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());

            const feeData: StudentFee = {
                admissionNumber: formData.admissionNumber.toUpperCase(),
                academicYear: formData.academicYear,
                semester: parseInt(formData.semester, 10),
                programCode: formData.programCode,
                paymentDate: paymentTimestamp.toISOString(), // Send Full ISO Timestamp
                totalFees: totalFees || 0,
                paidAmount: amountToPay,
                dueAmount: newDueAmount,
                status: status,
                feeType: feeType
            };
            
            await addStudentFee(feeData);
            
            alert(`Payment of ₹${amountToPay.toLocaleString('en-IN')} via ${paymentMethod} successful for ${activeTab === 'tuition' ? 'Tuition Fees' : 'Exam Fees'}!`);
            handleReset();

        } catch (error) {
            setError(error instanceof Error ? error.message : String(error));
        }
    };
    
    // Get beneficiary details based on the EFFECTIVE college (default or selected)
    const beneficiaryDetails = ACCOUNT_DETAILS[selectedCollege] || ACCOUNT_DETAILS[College.KNRR];

    return (
        <main className="flex-1 p-4 md:p-8 bg-transparent overflow-y-auto">
             <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button className="p-1 -ml-1 text-slate-400 hover:text-white md:hidden" onClick={onToggleSidebar}>
                        <MenuIcon className="h-6 w-6" />
                    </button>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">Online Payment</h2>
                        <p className="text-slate-400 mt-1 text-sm">Securely pay tuition and exam fees.</p>
                    </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col gap-1 text-sm min-w-[280px] shadow-lg md:self-start md:ml-auto">
                    <h4 className="text-blue-400 font-bold mb-1 uppercase tracking-wider text-xs">Beneficiary (College) Account</h4>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs">Account Holder:</span>
                        <span className="font-mono text-white font-medium">{beneficiaryDetails.holder}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs">Account Number:</span>
                        {/* MASKED ACCOUNT NUMBER */}
                        <span className="font-mono text-white font-medium">{beneficiaryDetails.number}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs">IFS Code:</span>
                        <span className="font-mono text-white font-medium">{beneficiaryDetails.ifsc}</span>
                    </div>
                </div>
            </div>

            {/* Tab Selection */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                    onClick={() => { setActiveTab('tuition'); setIsPaymentSectionOpen(false); }}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-center gap-3 ${activeTab === 'tuition' ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                >
                    <CurrencyDollarIcon className="h-6 w-6" />
                    <span className="font-bold text-lg">Tuition Fees Entry</span>
                    {activeTab === 'tuition' && <CheckCircleIcon className="h-6 w-6 text-white ml-2" />}
                </button>
                <button
                    onClick={() => { setActiveTab('exam'); setIsPaymentSectionOpen(false); }}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-center gap-3 ${activeTab === 'exam' ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                >
                    <AcademicCapIcon className="h-6 w-6" />
                    <span className="font-bold text-lg">Exam Fees Entry</span>
                    {activeTab === 'exam' && <CheckCircleIcon className="h-6 w-6 text-white ml-2" />}
                </button>
            </div>

            <div className="bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-800 relative">
                 <div className="mb-8 flex justify-between items-start">
                     <div>
                        <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-2">
                            {activeTab === 'tuition' ? 'Tuition Fee Details' : 'Exam Fee Details'}
                        </h3>
                        <p className="text-slate-400 text-sm">Fill in the details below to proceed with payment.</p>
                     </div>
                     <div className="flex items-center gap-2">
                        <label className="text-sm text-slate-400">College:</label>
                        {user.role === Role.CHAIRMAN ? (
                            <select 
                                value={selectedCollege} 
                                onChange={(e) => setSelectedCollege(e.target.value as College)} 
                                className="bg-slate-800 border border-slate-700 text-white text-sm rounded-md p-1.5 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {Object.entries(COLLEGE_NAMES).filter(([k]) => k !== 'ALL').map(([key, name]) => (
                                    <option key={key} value={key}>{name}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-md px-3 py-1.5 font-medium cursor-not-allowed">
                                {COLLEGE_NAMES[selectedCollege]}
                            </div>
                        )}
                    </div>
                </div>
                
                {error && <div className="p-3 mb-4 rounded-md text-sm font-medium bg-red-500/10 text-red-300 border border-red-500/20">{error}</div>}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                     <div className="space-y-6">
                         <div className="grid grid-cols-2 gap-4">
                             <Field label="Admission Number">
                                 <input 
                                    type="text" 
                                    name="admissionNumber" 
                                    value={formData.admissionNumber} 
                                    onChange={handleChange} 
                                    className={commonInputClass} 
                                    disabled={isStudent} 
                                    placeholder="e.g., KCSE202001"
                                    autoComplete="off" 
                                 />
                             </Field>
                             <Field label="Gender">
                                <select name="gender" value={formData.gender} onChange={handleChange} className={commonSelectClass}>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                </select>
                            </Field>
                         </div>

                         <Field label="Student Name">
                            <input type="text" value={studentName} readOnly className={`${commonInputClass} bg-slate-700 cursor-not-allowed`} placeholder="Student name appears here" />
                        </Field>

                         <Field label="Program Code">
                             <select name="programCode" value={formData.programCode} onChange={handleChange} className={commonSelectClass} disabled={isStudent}>
                                 {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                             </select>
                         </Field>

                         <div className="grid grid-cols-2 gap-4">
                            <Field label="Semester">
                                <select name="semester" value={formData.semester} onChange={handleChange} className={commonSelectClass}>
                                    {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => <option key={sem} value={sem}>{sem}</option>)}
                                </select>
                            </Field>
                            <Field label="Academic Year">
                                <select name="academicYear" value={formData.academicYear} onChange={handleChange} className={commonSelectClass} disabled={!formData.admissionNumber || derivedAcademicYears.length === 0}>
                                    <option value="">Select</option>
                                    {derivedAcademicYears.map(year => <option key={year} value={year}>{year}</option>)}
                                </select>
                            </Field>
                        </div>
                     </div>

                     <div className="space-y-6 flex flex-col h-full">
                        {activeTab === 'tuition' ? (
                            <>
                                <Field label="Admission Type">
                                    <select name="admissionType" value={formData.admissionType} onChange={handleChange} className={commonSelectClass}>
                                        <option>Counselling Seat/Scholarship/Sports Quota</option>
                                        <option>Management / Payment Seat</option>
                                    </select>
                                </Field>
                                <Field label="Total Fees (₹)"><input type="number" name="totalFees" value={formData.totalFees} onChange={handleChange} className={commonInputClass} onWheel={(e) => (e.target as HTMLInputElement).blur()} /></Field>
                                <Field label="Previously Paid (₹)"><input type="text" value={parseFloat(formData.previousPaidAmount).toLocaleString('en-IN')} readOnly className={`${commonInputClass} bg-slate-700 cursor-not-allowed`} /></Field>
                                
                               
                                <div className="mt-auto space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="Payment Date">
                                            <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} className={commonInputClass} required/>
                                        </Field>
                                        <Field label="Payment Amount (₹)">
                                            <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Enter amount" className={commonInputClass} onWheel={(e) => (e.target as HTMLInputElement).blur()} />
                                        </Field>
                                    </div>
                                 {/* DUE AMOUNT CARD - PLACED HERE */}
                                <div className="p-4 bg-red-600 rounded-lg flex justify-between items-center text-white shadow-lg my-2">
                                    <span className="font-bold text-base uppercase tracking-wider">DUE AMOUNT</span>
                                    <span className="text-2xl font-extrabold">₹{remainingDue.toLocaleString('en-IN')}</span>
                                </div>                                   
                                    <button 
                                        type="button"
                                        onClick={() => setIsPaymentSectionOpen(prev => !prev)}
                                        disabled={remainingDue <= 0}
                                        className={`w-full rounded-md p-3 flex items-center justify-center gap-2 shadow-lg text-white font-bold transition-all ${
                                            isPaymentSectionOpen ? 'bg-slate-600' : 'bg-green-600 hover:bg-green-500'
                                        }`}
                                    >
                                        <CreditCardIcon className="h-5 w-5" />
                                        {isPaymentSectionOpen ? 'Cancel Payment' : 'Proceed to Pay'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-4 bg-slate-800 border border-slate-700 rounded-md">
                                    <label className="block mb-2 text-sm font-bold text-slate-200">Select Subjects</label>
                                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                        <label className="flex items-center space-x-2 p-1.5 rounded hover:bg-slate-700 cursor-pointer">
                                            <input type="checkbox" checked={isAllSubjects} onChange={(e) => { setIsAllSubjects(e.target.checked); if(e.target.checked) setSelectedSubjects([]); }} className="w-4 h-4 rounded bg-gray-700 border-gray-600" />
                                            <span className="text-white text-sm">Whole Examination (All Subjects)</span>
                                        </label>
                                        {availableSubjects.map(sub => (
                                            <label key={sub} className={`flex items-center space-x-2 p-1.5 rounded cursor-pointer ${isAllSubjects ? 'opacity-50' : 'hover:bg-slate-700'}`}>
                                                <input type="checkbox" checked={selectedSubjects.includes(sub)} onChange={() => !isAllSubjects && (selectedSubjects.includes(sub) ? setSelectedSubjects(p => p.filter(s => s !== sub)) : setSelectedSubjects(p => [...p, sub]))} disabled={isAllSubjects} className="w-4 h-4 rounded bg-gray-700 border-gray-600" />
                                                <span className="text-slate-300 text-xs">{sub}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <Field label="Late Fee (₹)">
                                    <input type="number" name="lateFee" value={formData.lateFee} onChange={handleChange} className={commonInputClass} onWheel={(e) => (e.target as HTMLInputElement).blur()} />
                                </Field>
                               
                                <div className="mt-auto space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="Payment Date">
                                            <input type="date" name="paymentDate" value={formData.paymentDate} onChange={handleChange} className={commonInputClass} required/>
                                        </Field>
                                        <Field label="Payment Amount (₹)">
                                            <input type="text" value={formData.examFeeTotal} readOnly className={`${commonInputClass} bg-slate-700 cursor-not-allowed`} />
                                        </Field>
                                    </div>
                                {/* TOTAL EXAM FEE CARD */}
                                <div className="p-4 bg-blue-600 rounded-lg flex justify-between items-center text-white shadow-lg my-4">
                                    <span className="font-bold text-base uppercase tracking-wider">TOTAL EXAM FEE</span>
                                    <span className="text-2xl font-extrabold">₹{formData.examFeeTotal}</span>
                                </div>
                                    <button 
                                        type="button"
                                        onClick={() => setIsPaymentSectionOpen(prev => !prev)}
                                        disabled={parseInt(formData.examFeeTotal) <= 0}
                                        className={`w-full rounded-md p-3 flex items-center justify-center gap-2 shadow-lg text-white font-bold transition-all ${
                                            isPaymentSectionOpen ? 'bg-slate-600' : 'bg-green-600 hover:bg-green-500'
                                        }`}
                                    >
                                        <CreditCardIcon className="h-5 w-5" />
                                        {isPaymentSectionOpen ? 'Cancel Payment' : 'Proceed to Pay'}
                                    </button>
                                </div>
                            </>
                        )}
                     </div>
                </div>

                {isPaymentSectionOpen && (
                    <div className="mt-8 border-t border-slate-700 pt-8 animate-fade-in">
                        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                            <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                                <DocumentIcon className="h-5 w-5 text-blue-400" /> Payment Gateway
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <Field label="Payment Method">
                                    <select 
                                        value={paymentMethod} 
                                        onChange={(e) => setPaymentMethod(e.target.value)} 
                                        className={`${commonSelectClass} bg-slate-900 border-slate-600 h-12 text-base`}
                                    >
                                        <option>Debit Card</option>
                                        <option>Credit Card</option>
                                        <option>Cashier’s Cheque</option>
                                        <option>Banker’s Cheques</option>
                                        <option>Demand Draft (DD)</option>
                                        <option>Certified Cheque</option>
                                    </select>
                                </Field>
                                
                                <Field label="Payment Date">
                                    <input 
                                        type="text" 
                                        name="gatewayPaymentDate" 
                                        value={new Date().toLocaleDateString('en-GB')}
                                        readOnly
                                        className={`${commonInputClass} bg-slate-700 cursor-not-allowed`}
                                        title="Current System Date will be logged"
                                    />
                                </Field>
                            </div>

                            {['Debit Card', 'Credit Card'].includes(paymentMethod) ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-slate-600 rounded-md bg-slate-900/50">
                                    <div className="md:col-span-2 text-blue-300 font-semibold mb-2 uppercase text-xs tracking-wider">
                                        {paymentMethod.toUpperCase()} DETAILS
                                    </div>
                                    
                                    {/* Bank Name Dropdown */}
                                    <div className="md:col-span-2">
                                        <Field label="Bank Name">
                                            <select 
                                                value={cardDetails.bankName}
                                                onChange={e => setCardDetails(prev => ({...prev, bankName: e.target.value}))}
                                                className={commonSelectClass}
                                            >
                                                <option value="">Select Bank</option>
                                                {BANK_LIST.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                                            </select>
                                        </Field>
                                    </div>

                                    <div className="md:col-span-2">
                                        <Field label="Card Holder Name">
                                            <input 
                                                type="text" 
                                                value={cardDetails.holderName}
                                                onChange={e => setCardDetails(prev => ({...prev, holderName: e.target.value}))}
                                                placeholder="Name as on card"
                                                className={commonInputClass}
                                                autoComplete="off"
                                                name="random-name-field"
                                            />
                                        </Field>
                                    </div>

                                    <Field label="Card Number" error={fieldErrors.cardNumber}>
                                        <input 
                                            type="text" 
                                            value={cardDetails.cardNumber}
                                            onChange={e => { const val = e.target.value; if (/^\d*$/.test(val) && val.length <= 16) setCardDetails(p => ({ ...p, cardNumber: val })) }}
                                            onBlur={() => validateField('cardNumber', cardDetails.cardNumber)}
                                            placeholder="XXXX XXXX XXXX XXXX"
                                            maxLength={16}
                                            className={`${commonInputClass} ${fieldErrors.cardNumber ? 'border-red-500' : ''}`}
                                            autoComplete="off"
                                        />
                                    </Field>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="Expiry Date" error={fieldErrors.expiry}>
                                            <input 
                                                type="text" 
                                                value={cardDetails.expiry}
                                                onChange={e => {
                                                    let val = e.target.value.replace(/\D/g, ''); 
                                                    if (val.length >= 2) {
                                                         const monthStr = val.substring(0, 2);
                                                         const month = parseInt(monthStr, 10);
                                                         if (month > 12) {
                                                             val = val.substring(0, 1); 
                                                         } else if (month === 0 && val.length === 2) {
                                                             val = '01';
                                                         }
                                                    }
                                                    if (val.length > 4) val = val.slice(0, 4);
                                                    let formatted = val;
                                                    if (val.length > 2) {
                                                        formatted = val.substring(0, 2) + '/' + val.substring(2);
                                                    }
                                                    setCardDetails(p => ({ ...p, expiry: formatted }));
                                                }}
                                                onBlur={() => validateField('expiry', cardDetails.expiry)}
                                                placeholder="MM/YY"
                                                maxLength={5}
                                                className={`${commonInputClass} ${fieldErrors.expiry ? 'border-red-500' : ''}`}
                                            />
                                        </Field>
                                        <Field label="CVV" error={fieldErrors.cvv}>
                                            <input 
                                                type="password" 
                                                value={cardDetails.cvv}
                                                onChange={e => setCardDetails(p => ({...p, cvv: e.target.value.replace(/\D/g,'').slice(0,4)}))}
                                                onBlur={() => validateField('cvv', cardDetails.cvv)}
                                                placeholder="123"
                                                maxLength={4}
                                                className={`${commonInputClass} ${fieldErrors.cvv ? 'border-red-500' : ''}`}
                                                autoComplete="off"
                                            />
                                        </Field>
                                    </div>

                                    <Field label="Mobile Number">
                                        <input 
                                            type="tel" 
                                            value={cardDetails.mobile}
                                            onChange={e => { const val = e.target.value; if (/^\d*$/.test(val) && val.length <= 10) setCardDetails(p => ({ ...p, mobile: val })) }}
                                            placeholder="For receipt"
                                            maxLength={10}
                                            className={commonInputClass}
                                        />
                                    </Field>

                                    <Field label="Email">
                                        <input 
                                            type="email" 
                                            value={cardDetails.email}
                                            onChange={e => setCardDetails(prev => ({...prev, email: e.target.value}))}
                                            placeholder="For receipt"
                                            className={commonInputClass}
                                        />
                                    </Field>

                                    <div className="md:col-span-2">
                                        <Field label="Billing Address">
                                            <input 
                                                type="text" 
                                                value={cardDetails.address}
                                                onChange={e => setCardDetails(prev => ({...prev, address: e.target.value}))}
                                                placeholder="Billing address associated with card"
                                                className={commonInputClass}
                                            />
                                        </Field>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border border-slate-600 rounded-md bg-slate-900/50">
                                     <div className="md:col-span-2 text-blue-300 font-semibold mb-2 uppercase text-xs tracking-wider flex items-center gap-2">
                                        <DocumentIcon className="h-4 w-4" />
                                        {paymentMethod.toUpperCase()} DETAILS
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <Field label="Bank Name">
                                            <input 
                                                type="text" 
                                                value={checkDetails.bankName}
                                                onChange={e => setCheckDetails(prev => ({...prev, bankName: e.target.value}))}
                                                placeholder="Issuing Bank Name"
                                                className={commonInputClass}
                                            />
                                        </Field>
                                    </div>

                                    <Field label="Instrument Number (DD/Cheque No)">
                                        <input 
                                            type="text" 
                                            value={checkDetails.instrumentNumber}
                                            onChange={e => { const val = e.target.value; if (/^\d*$/.test(val)) setCheckDetails(p => ({ ...p, instrumentNumber: val })) }}
                                            placeholder="Enter Number"
                                            className={commonInputClass}
                                        />
                                    </Field>
                                    
                                    <Field label="Issue Date">
                                        <input 
                                            type="date" 
                                            value={checkDetails.issueDate}
                                            onChange={e => setCheckDetails(prev => ({...prev, issueDate: e.target.value}))}
                                            className={commonInputClass}
                                        />
                                    </Field>

                                    <div className="md:col-span-2">
                                        <Field label="Branch Name">
                                            <input 
                                                type="text" 
                                                value={checkDetails.branchName}
                                                onChange={e => { const val = e.target.value; if (/^[a-zA-Z\s]*$/.test(val)) setCheckDetails(p => ({ ...p, branchName: val })) }}
                                                placeholder="Issuing Branch"
                                                className={commonInputClass}
                                            />
                                        </Field>
                                    </div>
                                </div>
                            )}
                            
                            <div className="mt-8 flex gap-4">
                                <button 
                                    onClick={handleSubmit} 
                                    className="flex-1 text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-bold rounded-lg text-base px-6 py-3 text-center transition-colors shadow-lg"
                                >
                                    Submit Payment
                                </button>
                                <button 
                                    onClick={() => setIsPaymentSectionOpen(false)} 
                                    className="flex-1 text-white bg-slate-700 hover:bg-slate-600 focus:ring-4 focus:ring-slate-500 font-bold rounded-lg text-base px-6 py-3 text-center transition-colors shadow-lg"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default OnlineFeePayment;
