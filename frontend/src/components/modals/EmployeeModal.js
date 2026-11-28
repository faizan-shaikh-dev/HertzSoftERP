'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  UserCheck, 
  GraduationCap, 
  Briefcase, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  AlertCircle, 
  Loader2,
  DollarSign
} from 'lucide-react';
import { toast } from 'react-toastify';
import employeeService from '@/services/employeeService';

const DEPARTMENTS = [
  'Engineering / Web Development',
  'Mobile App Development',
  'UI/UX & Product Design',
  'Quality Assurance & Testing',
  'Sales & Business Development',
  'Digital Marketing & Growth',
  'Human Resources & Operations',
  'Finance & Accounts'
];

const WORK_MODES = ['On-site', 'Hybrid', 'Remote'];
const STATUSES = ['Active', 'Probation', 'Completed', 'Exited', 'On Leave'];
const INTERN_DURATIONS = ['1 Month', '2 Months', '3 Months', '6 Months', 'Custom'];

export default function EmployeeModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialType = 'Full-time', 
  editingEmployee = null,
  showTypeToggle = false 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [type, setType] = useState(initialType);
  const [employeeCode, setEmployeeCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [designation, setDesignation] = useState('');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('Active');
  const [workMode, setWorkMode] = useState('On-site');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [notes, setNotes] = useState('');

  // Full-time specific
  const [salaryMonthly, setSalaryMonthly] = useState('');
  const [probationMonths, setProbationMonths] = useState(3);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  // Intern specific
  const [collegeName, setCollegeName] = useState('');
  const [degree, setDegree] = useState('');
  const [internshipDuration, setInternshipDuration] = useState('3 Months');
  const [internshipEndDate, setInternshipEndDate] = useState('');
  const [mentorName, setMentorName] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [stipendMonthly, setStipendMonthly] = useState('');

  useEffect(() => {
    if (editingEmployee) {
      setType(editingEmployee.type || 'Full-time');
      setEmployeeCode(editingEmployee.employee_code || '');
      setName(editingEmployee.name || '');
      setEmail(editingEmployee.email || '');
      setPersonalEmail(editingEmployee.personal_email || '');
      setPhone(editingEmployee.phone || '');
      setAlternatePhone(editingEmployee.alternate_phone || '');
      setGender(editingEmployee.gender || 'Male');
      setDob(editingEmployee.date_of_birth ? editingEmployee.date_of_birth.slice(0, 10) : '');
      setDepartment(editingEmployee.department || DEPARTMENTS[0]);
      setDesignation(editingEmployee.designation || '');
      setJoiningDate(editingEmployee.joining_date ? editingEmployee.joining_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setStatus(editingEmployee.status || 'Active');
      setWorkMode(editingEmployee.work_mode || 'On-site');
      setAddress(editingEmployee.address || '');
      setCity(editingEmployee.city || 'Mumbai');
      setNotes(editingEmployee.notes || '');

      setSalaryMonthly(editingEmployee.salary_monthly ? String(editingEmployee.salary_monthly) : '');
      setProbationMonths(editingEmployee.probation_period_months || 3);
      setEmergencyName(editingEmployee.emergency_contact_name || '');
      setEmergencyPhone(editingEmployee.emergency_contact_phone || '');
      setPanNumber(editingEmployee.pan_number || '');
      setAadhaarNumber(editingEmployee.aadhaar_number || '');
      setBankName(editingEmployee.bank_name || '');
      setAccountNumber(editingEmployee.account_number || '');
      setIfscCode(editingEmployee.ifsc_code || '');
      setUpiId(editingEmployee.upi_id || '');

      setCollegeName(editingEmployee.college_name || '');
      setDegree(editingEmployee.degree || '');
      setInternshipDuration(editingEmployee.internship_duration || '3 Months');
      setInternshipEndDate(editingEmployee.internship_end_date ? editingEmployee.internship_end_date.slice(0, 10) : '');
      setMentorName(editingEmployee.mentor_name || '');
      setIsPaid(Boolean(editingEmployee.is_paid));
      setStipendMonthly(editingEmployee.stipend_monthly ? String(editingEmployee.stipend_monthly) : '');
    } else {
      setType(initialType);
      setEmployeeCode('');
      setName('');
      setEmail('');
      setPersonalEmail('');
      setPhone('');
      setAlternatePhone('');
      setGender('Male');
      setDob('');
      setDepartment(DEPARTMENTS[0]);
      setDesignation(initialType === 'Intern' ? 'Frontend Web Intern' : 'Full Stack Developer');
      setJoiningDate(new Date().toISOString().slice(0, 10));
      setStatus('Active');
      setWorkMode('On-site');
      setAddress('');
      setCity('Mumbai');
      setNotes('');

      setSalaryMonthly('');
      setProbationMonths(3);
      setEmergencyName('');
      setEmergencyPhone('');
      setPanNumber('');
      setAadhaarNumber('');
      setBankName('');
      setAccountNumber('');
      setIfscCode('');
      setUpiId('');

      setCollegeName('');
      setDegree('');
      setInternshipDuration('3 Months');
      setInternshipEndDate('');
      setMentorName('');
      setIsPaid(false);
      setStipendMonthly('');
    }
    setError(null);
  }, [editingEmployee, initialType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide the full name.');
      return;
    }
    if (!email.trim()) {
      setError('Official / Primary email address is required.');
      return;
    }
    if (!phone.trim()) {
      setError('Primary contact phone number is required.');
      return;
    }
    if (!designation.trim()) {
      setError('Role / Designation is required.');
      return;
    }

    setLoading(true);

    const payload = {
      type,
      employee_code: employeeCode.trim() || undefined,
      name: name.trim(),
      email: email.trim(),
      personal_email: personalEmail.trim() || undefined,
      phone: phone.trim(),
      alternate_phone: alternatePhone.trim() || undefined,
      gender,
      date_of_birth: dob || undefined,
      department,
      designation: designation.trim(),
      joining_date: joiningDate,
      status,
      work_mode: workMode,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      notes: notes.trim() || undefined,

      // Full time
      salary_monthly: type === 'Full-time' ? (Number(salaryMonthly) || 0) : 0,
      probation_period_months: type === 'Full-time' ? Number(probationMonths) : 0,
      emergency_contact_name: emergencyName.trim() || undefined,
      emergency_contact_phone: emergencyPhone.trim() || undefined,
      pan_number: panNumber.trim() || undefined,
      aadhaar_number: aadhaarNumber.trim() || undefined,
      bank_name: bankName.trim() || undefined,
      account_number: accountNumber.trim() || undefined,
      ifsc_code: ifscCode.trim() || undefined,
      upi_id: upiId.trim() || undefined,

      // Intern
      college_name: type === 'Intern' ? collegeName.trim() : undefined,
      degree: type === 'Intern' ? degree.trim() : undefined,
      internship_duration: type === 'Intern' ? internshipDuration : undefined,
      internship_end_date: type === 'Intern' ? (internshipEndDate || undefined) : undefined,
      mentor_name: type === 'Intern' ? mentorName.trim() : undefined,
      is_paid: type === 'Intern' ? isPaid : false,
      stipend_monthly: type === 'Intern' && isPaid ? (Number(stipendMonthly) || 0) : 0
    };

    try {
      if (editingEmployee) {
        await employeeService.updateEmployee(editingEmployee.id, payload);
        toast.success(`${type === 'Intern' ? 'Intern' : 'Employee'} updated successfully!`);
      } else {
        await employeeService.createEmployee(payload);
        toast.success(`New ${type === 'Intern' ? 'Intern' : 'Employee'} added successfully!`);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to save record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-[#DFEAF2] w-full max-w-3xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#EAF3FB] border-b border-[#DFEAF2] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#0077B6] text-white flex items-center justify-center shadow-xs">
              {type === 'Intern' ? <GraduationCap className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#19324D]">
                {editingEmployee ? `Edit ${type === 'Intern' ? 'Intern Profile' : 'Staff Member'}` : `Register New ${type === 'Intern' ? 'Intern' : 'Staff Member'}`}
              </h3>
              <p className="text-xs text-[#71869B]">
                {type === 'Intern' ? 'Academic internship tenure, college background, and mentor details' : 'Core full-time employment, CTC, probation, and bank account details'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#71869B] hover:text-[#19324D] hover:bg-white/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Toggle Switch (Only if showTypeToggle is explicitly enabled and not in edit mode) */}
        {showTypeToggle && !editingEmployee && (
          <div className="px-6 pt-4 pb-2 bg-[#F8FAFD] border-b border-[#DFEAF2]">
            <div className="inline-flex p-1 bg-white border border-[#DFEAF2] rounded-lg shadow-2xs gap-1">
              <button
                type="button"
                onClick={() => setType('Full-time')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition cursor-pointer ${
                  type === 'Full-time'
                    ? 'bg-[#0077B6] text-white shadow-xs'
                    : 'text-[#71869B] hover:text-[#19324D] hover:bg-[#F4F8FC]'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Full-Time Staff</span>
              </button>

              <button
                type="button"
                onClick={() => setType('Intern')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition cursor-pointer ${
                  type === 'Intern'
                    ? 'bg-[#8965E0] text-white shadow-xs'
                    : 'text-[#71869B] hover:text-[#19324D] hover:bg-[#F4F8FC]'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Trainee / Intern</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Section 1: Basic & Contact Information */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#0077B6] border-b border-[#DFEAF2] pb-1.5 mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Personal & Contact Information</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#19324D] font-bold mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] focus:border-[#0077B6] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#19324D] font-bold mb-1">
                  {type === 'Intern' ? 'Intern ID / Code (Auto or Custom)' : 'Employee ID / Code (Auto or Custom)'}
                </label>
                <input
                  type="text"
                  placeholder={type === 'Intern' ? 'Auto (e.g. HE-INT-101)' : 'Auto (e.g. HE-EMP-101)'}
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] font-mono focus:border-[#0077B6] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#19324D] font-bold mb-1">
                  Official / Work Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@hertzsoft.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] focus:border-[#0077B6] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#19324D] font-bold mb-1">
                  Personal Email Address
                </label>
                <input
                  type="email"
                  placeholder="personal@gmail.com"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] focus:border-[#0077B6] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#19324D] font-bold mb-1">
                  Primary Mobile / WhatsApp Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] font-mono focus:border-[#0077B6] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#19324D] font-bold mb-1">
                  Gender & Date of Birth
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-2.5 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] bg-white focus:border-[#0077B6] outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>

                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-2 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] focus:border-[#0077B6] outline-none text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Role, Department & Work Mode */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#0077B6] border-b border-[#DFEAF2] pb-1.5 mb-3 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Department & Employment Setup</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#19324D] font-bold mb-1">
                  Department *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] bg-white focus:border-[#0077B6] outline-none"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#19324D] font-bold mb-1">
                  Designation / Role *
                </label>
                <input
                  type="text"
                  required
                  placeholder={type === 'Intern' ? 'e.g. Flutter Development Intern' : 'e.g. Senior Full Stack Engineer'}
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] focus:border-[#0077B6] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#19324D] font-bold mb-1">
                  Date of Joining (DOJ) *
                </label>
                <input
                  type="date"
                  required
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] focus:border-[#0077B6] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#19324D] font-bold mb-1">
                  Work Mode & Current Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value)}
                    className="w-full px-2.5 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] bg-white focus:border-[#0077B6] outline-none"
                  >
                    {WORK_MODES.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>

                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-2.5 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] bg-white focus:border-[#0077B6] outline-none font-semibold"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Full-time specifics OR Intern specifics */}
          {type === 'Full-time' ? (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#0077B6] border-b border-[#DFEAF2] pb-1.5 mb-3 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Compensation, Bank & KYC Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[#19324D] font-bold mb-1">
                    Monthly Gross / In-Hand CTC (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 45000"
                    value={salaryMonthly}
                    onChange={(e) => setSalaryMonthly(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] font-mono focus:border-[#0077B6] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#19324D] font-bold mb-1">
                    Probation Period (Months)
                  </label>
                  <select
                    value={probationMonths}
                    onChange={(e) => setProbationMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] bg-white focus:border-[#0077B6] outline-none"
                  >
                    <option value={1}>1 Month</option>
                    <option value={2}>2 Months</option>
                    <option value={3}>3 Months (Standard)</option>
                    <option value={6}>6 Months</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#19324D] font-bold mb-1">
                    Bank Name & Account No.
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Bank Name"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-2.5 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] focus:border-[#0077B6] outline-none"
                    />
                    <input
                      type="text"
                      placeholder="A/C Number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-2.5 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] font-mono focus:border-[#0077B6] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#19324D] font-bold mb-1">
                    IFSC Code & UPI ID
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="IFSC Code"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      className="w-full px-2.5 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] font-mono focus:border-[#0077B6] outline-none uppercase"
                    />
                    <input
                      type="text"
                      placeholder="UPI ID"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-2.5 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] font-mono focus:border-[#0077B6] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#19324D] font-bold mb-1">
                    PAN & Aadhaar Number
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="PAN (ABCDE1234F)"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value)}
                      className="w-full px-2.5 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] font-mono focus:border-[#0077B6] outline-none uppercase"
                    />
                    <input
                      type="text"
                      placeholder="Aadhaar No."
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value)}
                      className="w-full px-2.5 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] font-mono focus:border-[#0077B6] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#19324D] font-bold mb-1">
                    Emergency Contact (Name & Phone)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Contact Name"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="w-full px-2.5 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] focus:border-[#0077B6] outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Contact Phone"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full px-2.5 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] font-mono focus:border-[#0077B6] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Intern specifics */
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#8965E0] border-b border-[#DFEAF2] pb-1.5 mb-3 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>College, Duration & Mentor Assignment</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[#19324D] font-bold mb-1">
                    College / University / Institute Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai University / VJTI"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] focus:border-[#8965E0] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#19324D] font-bold mb-1">
                    Degree / Course / Stream
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. B.Tech Computer Engineering / MCA"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] focus:border-[#8965E0] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#19324D] font-bold mb-1">
                    Internship Tenure & Duration
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={internshipDuration}
                      onChange={(e) => setInternshipDuration(e.target.value)}
                      className="w-full px-2.5 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] bg-white focus:border-[#8965E0] outline-none"
                    >
                      {INTERN_DURATIONS.map((dur) => (
                        <option key={dur} value={dur}>{dur}</option>
                      ))}
                    </select>

                    <input
                      type="date"
                      title="Estimated End Date"
                      value={internshipEndDate}
                      onChange={(e) => setInternshipEndDate(e.target.value)}
                      className="w-full px-2 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] focus:border-[#8965E0] outline-none text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#19324D] font-bold mb-1">
                    Assigned Senior Mentor / Guide
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Tech Lead"
                    value={mentorName}
                    onChange={(e) => setMentorName(e.target.value)}
                    className="w-full px-3 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] focus:border-[#8965E0] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#19324D] font-bold mb-1">
                    Stipend Status
                  </label>
                  <div className="flex items-center gap-4 mt-1">
                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="stipendType"
                        checked={!isPaid}
                        onChange={() => setIsPaid(false)}
                        className="text-[#8965E0]"
                      />
                      <span className="font-medium text-[#19324D]">Unpaid / Academic OJT</span>
                    </label>

                    <label className="inline-flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="stipendType"
                        checked={isPaid}
                        onChange={() => setIsPaid(true)}
                        className="text-[#8965E0]"
                      />
                      <span className="font-medium text-[#19324D]">Paid Stipend</span>
                    </label>
                  </div>
                </div>

                {isPaid && (
                  <div>
                    <label className="block text-[#19324D] font-bold mb-1">
                      Monthly Stipend Amount (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 8000"
                      value={stipendMonthly}
                      onChange={(e) => setStipendMonthly(e.target.value)}
                      className="w-full px-3 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] font-mono focus:border-[#8965E0] outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 4: Address & Remarks */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#0077B6] border-b border-[#DFEAF2] pb-1.5 mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Residential Address & Remarks</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[#19324D] font-bold mb-1">
                  City & State
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai, Maharashtra"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] focus:border-[#0077B6] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#19324D] font-bold mb-1">
                  Full Residential Address
                </label>
                <input
                  type="text"
                  placeholder="Flat No, Building, Street, Area..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] focus:border-[#0077B6] outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[#19324D] font-bold mb-1">
                  Internal HR Notes / Special Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Any background verification remarks, tech stack notes or onboarding comments..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-[#DFEAF2] rounded-lg text-[#19324D] focus:border-[#0077B6] outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#DFEAF2] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-[#DFEAF2] rounded-lg text-xs font-semibold text-[#19324D] hover:bg-[#F4F8FC] transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#0077B6] hover:bg-[#005f92] text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{editingEmployee ? 'Update Record' : `Save ${type === 'Intern' ? 'Intern' : 'Employee'}`}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
