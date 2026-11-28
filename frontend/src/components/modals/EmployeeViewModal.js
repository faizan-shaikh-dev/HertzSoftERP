'use client';

import { X, Briefcase, GraduationCap, Building2, Mail, Phone, MapPin, Calendar, CreditCard, Shield, User } from 'lucide-react';

export default function EmployeeViewModal({ isOpen, onClose, employee }) {
  if (!isOpen || !employee) return null;

  const isIntern = employee.type === 'Intern';

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(Number(val) || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-[#DFEAF2] w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className={`p-6 text-white ${isIntern ? 'bg-gradient-to-r from-[#8965E0] to-[#7048cf]' : 'bg-gradient-to-r from-[#0077B6] to-[#005f92]'} flex items-start justify-between`}>
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full bg-white/15 border-2 border-white/30 flex items-center justify-center text-white text-xl font-black">
              {employee.name ? employee.name.charAt(0).toUpperCase() : 'E'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white m-0">
                  {employee.name}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider font-mono">
                  {employee.employee_code}
                </span>
              </div>
              <div className="text-xs text-white/90 font-medium mt-0.5">
                {employee.designation} • {employee.department}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  employee.status === 'Active'
                    ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/40'
                    : employee.status === 'Probation'
                    ? 'bg-amber-400/20 text-amber-100 border border-amber-300/40'
                    : 'bg-white/10 text-white border border-white/20'
                }`}>
                  ● {employee.status}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-white/15 text-white">
                  {employee.work_mode}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Details */}
        <div className="p-6 space-y-5 text-xs text-[#19324D] max-h-[70vh] overflow-y-auto">
          
          {/* Contact Details */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#71869B] mb-2 border-b border-[#DFEAF2] pb-1">
              Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[#71869B] block text-[11px]">Primary Phone</span>
                <span className="font-mono font-bold">{employee.phone || '—'}</span>
              </div>
              <div>
                <span className="text-[#71869B] block text-[11px]">Work Email</span>
                <span className="font-semibold text-[#0077B6]">{employee.email || '—'}</span>
              </div>
              {employee.personal_email && (
                <div>
                  <span className="text-[#71869B] block text-[11px]">Personal Email</span>
                  <span>{employee.personal_email}</span>
                </div>
              )}
              {employee.city && (
                <div>
                  <span className="text-[#71869B] block text-[11px]">Location</span>
                  <span>{employee.city}</span>
                </div>
              )}
            </div>
          </div>

          {/* Role & Tenure */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#71869B] mb-2 border-b border-[#DFEAF2] pb-1">
              Tenure & Employment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[#71869B] block text-[11px]">Date of Joining</span>
                <span className="font-bold">{formatDate(employee.joining_date)}</span>
              </div>
              <div>
                <span className="text-[#71869B] block text-[11px]">Employment Type</span>
                <span className="font-bold">{employee.type}</span>
              </div>
            </div>
          </div>

          {/* Full-Time Specific Compensation & Bank Details */}
          {!isIntern ? (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#71869B] mb-2 border-b border-[#DFEAF2] pb-1">
                Compensation & Banking
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[#71869B] block text-[11px]">Monthly CTC / Salary</span>
                  <span className="font-mono font-bold text-base text-[#20A36B]">
                    ₹ {formatCurrency(employee.salary_monthly)}
                  </span>
                </div>
                <div>
                  <span className="text-[#71869B] block text-[11px]">Probation Period</span>
                  <span className="font-semibold">{employee.probation_period_months || 3} Months</span>
                </div>
                {employee.bank_name && (
                  <div>
                    <span className="text-[#71869B] block text-[11px]">Bank Name & A/C</span>
                    <span className="font-mono">{employee.bank_name} • {employee.account_number || '—'}</span>
                  </div>
                )}
                {employee.ifsc_code && (
                  <div>
                    <span className="text-[#71869B] block text-[11px]">IFSC Code</span>
                    <span className="font-mono uppercase">{employee.ifsc_code}</span>
                  </div>
                )}
                {employee.pan_number && (
                  <div>
                    <span className="text-[#71869B] block text-[11px]">PAN Number</span>
                    <span className="font-mono uppercase">{employee.pan_number}</span>
                  </div>
                )}
                {employee.emergency_contact_name && (
                  <div>
                    <span className="text-[#71869B] block text-[11px]">Emergency Contact</span>
                    <span>{employee.emergency_contact_name} ({employee.emergency_contact_phone || '—'})</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Intern College & Mentor details */
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#71869B] mb-2 border-b border-[#DFEAF2] pb-1">
                Academic & Internship Record
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[#71869B] block text-[11px]">College / Institute</span>
                  <span className="font-bold">{employee.college_name || '—'}</span>
                </div>
                <div>
                  <span className="text-[#71869B] block text-[11px]">Degree / Branch</span>
                  <span>{employee.degree || '—'}</span>
                </div>
                <div>
                  <span className="text-[#71869B] block text-[11px]">Internship Tenure</span>
                  <span className="font-semibold">{employee.internship_duration || '3 Months'}</span>
                </div>
                <div>
                  <span className="text-[#71869B] block text-[11px]">Assigned Mentor</span>
                  <span className="font-semibold text-[#8965E0]">{employee.mentor_name || 'Assigned Lead'}</span>
                </div>
                <div>
                  <span className="text-[#71869B] block text-[11px]">Stipend</span>
                  <span className="font-bold">
                    {employee.is_paid ? `₹ ${formatCurrency(employee.stipend_monthly)} / month` : 'Academic OJT / Unpaid'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {employee.notes && (
            <div className="p-3 bg-[#F8FAFD] rounded-lg border border-[#DFEAF2] text-[11px] text-[#71869B]">
              <strong className="text-[#19324D] block mb-0.5">HR Notes:</strong>
              {employee.notes}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#F8FAFD] border-t border-[#DFEAF2] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0077B6] text-white rounded-lg text-xs font-bold hover:bg-[#005f92] transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
