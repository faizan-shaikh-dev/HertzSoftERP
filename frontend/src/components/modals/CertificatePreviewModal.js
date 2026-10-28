'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import certificateService from '@/services/certificateService';
import { 
  X, 
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
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-purple-300">
              <Award className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate">
                {certificate.document_type} — {certificate.candidate_name}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono">
                <span>{certificate.certificate_number}</span>
                <span>•</span>
                <span className="text-emerald-400 font-sans font-semibold">Verified Authentic</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySerial}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
              title="Copy verification serial code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy ID'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-xs font-bold text-white shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
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

