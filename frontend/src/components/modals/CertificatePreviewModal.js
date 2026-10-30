'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import certificateService from '@/services/certificateService';
import { 
  XCircle, 
  Printer, 
  Copy, 
  ExternalLink, 
  Award, 
  Check, 
  Loader2 
} from 'lucide-react';

export default function CertificatePreviewModal({ isOpen, onClose, certificate = null }) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !certificate) return null;

  const previewUrl = certificateService.getPreviewUrl(certificate.id);

  const handleCopySerial = () => {
    const text = certificate.certificate_number || '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`Verification ID "${text}" copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    } else {
      window.open(previewUrl, '_blank');
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/75 backdrop-blur-xs">
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-auto h-[92vh] flex flex-col">
        {/* Top Control Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#326fa8] via-[#4689C8] to-[#4689C8] border-b-2 border-[#5FC8D6]/40 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-white/15 text-white border border-white/25 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white truncate">
                  {certificate.document_type} — {certificate.candidate_name}
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-100 border border-emerald-400/40">
                  Verified Authentic
                </span>
              </div>
              <p className="text-xs text-[#e0f7fa] font-mono mt-0.5">
                Serial: {certificate.certificate_number}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopySerial}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-white/15 hover:bg-white/25 rounded-md border border-white/25 transition cursor-pointer"
              title="Copy verification serial code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy ID'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#172b4d] bg-white hover:bg-slate-50 rounded-md shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#4689C8]" />
              <span>Print / Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition cursor-pointer p-0.5 rounded-full"
              aria-label="Close dialog"
            >
              <XCircle className="w-6 h-6 stroke-[1.5]" />
            </button>
          </div>
        </div>

        {/* Live Document Iframe */}
        <div className="flex-1 bg-slate-100 relative">
          <iframe
            ref={iframeRef}
            src={previewUrl}
            title={`Certificate Preview - ${certificate.certificate_number}`}
            className="w-full h-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

