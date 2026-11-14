'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  Users, 
  UserCheck, 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  ExternalLink, 
  Calendar, 
  Phone, 
  Mail, 
  Building2, 
  FolderKanban, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Tag
} from 'lucide-react';
import { toast } from 'react-toastify';
import AppLayout from '@/components/AppLayout';
import leadService from '@/services/leadService';

function WhatsAppIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function ClientsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('converted_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Fetch converted leads / clients from API
  const fetchClients = useCallback(async (isRefresh = false) => {
    try {
      setLoading(true);
      const res = await leadService.getLeads({
        is_converted: 'true',
        sort_by: sortField,
        sort_order: sortOrder
      });
      setLeads(res?.data || []);
      if (isRefresh) {
        toast.info('Clients list refreshed.');
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
      toast.error('Could not load clients data.');
    } finally {
      setLoading(false);
    }
  }, [sortField, sortOrder]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Filtered by local search query
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const q = searchQuery.toLowerCase().trim();
    return leads.filter((item) => {
      const name = item.name?.toLowerCase() || '';
      const company = item.company_name?.toLowerCase() || '';
      const phone = String(item.phone || '').toLowerCase();
      const clientNumber = String(item.converted_client_number || '');
      const leadNumber = String(item.lead_number || '');
      const requirement = (item.service_interest || item.requirement || '').toLowerCase();
      const owner = (item.assigned_to_name || '').toLowerCase();

      return (
        name.includes(q) ||
        company.includes(q) ||
        phone.includes(q) ||
        clientNumber.includes(q) ||
        leadNumber.includes(q) ||
        requirement.includes(q) ||
        owner.includes(q)
      );
    });
  }, [leads, searchQuery]);

  // Pagination calculations
  const totalItems = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return '';
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const getCleanPhone = (phone) => {
    if (!phone) return '';
    const digits = String(phone).replace(/\D/g, '');
    return digits.length === 10 ? `91${digits}` : digits;
  };

  return (
    <AppLayout title="Clients">
      {/* MASTER CONTAINER CARD */}
      <div className="card shadow-sm mb-4 bg-white border border-[#DFEAF2] rounded-xl overflow-hidden min-h-[82vh]">
        {/* Card Header */}
        <div className="card-header px-4 sm:px-6 py-4 bg-white border-b border-[#DFEAF2] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/leads"
              className="btn btn-sm inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#F4F8FC] hover:bg-[#EAF3FB] text-[#19324D] border border-[#DFEAF2] transition cursor-pointer"
              title="Back to All Leads"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-[#19324D] tracking-tight m-0">
                  Clients
                </h2>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#EAF8F1] text-[#20A36B] border border-[#20A36B]/30">
                  {leads.length} Clients
                </span>
              </div>
              <p className="text-xs text-[#71869B] mt-0.5">
                Verified ERP Client profiles converted from business inquiries
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/leads"
              className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#19324D] bg-white hover:bg-[#EAF3FB] border border-[#DFEAF2] rounded-lg shadow-xs transition"
            >
              <Users className="w-3.5 h-3.5 text-[#4689C8]" />
              <span>All Leads</span>
            </Link>

            <Link
              href="/projects"
              className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#4689C8] to-[#5FC8D6] hover:opacity-90 rounded-lg shadow-xs transition"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Client Projects</span>
            </Link>

            <button
              type="button"
              onClick={() => fetchClients(true)}
              disabled={loading}
              className="btn btn-sm inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white hover:bg-[#EAF3FB] text-[#19324D] border border-[#DFEAF2] shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Refresh list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#4689C8]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="card-body p-4 sm:p-6 space-y-4">
          {/* Controls Toolbar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#DFEAF2]">
            {/* Show Entries */}
            <div className="flex items-center gap-1.5 text-xs text-[#71869B]">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="text-xs px-2.5 py-1 bg-white border border-[#DFEAF2] rounded-md text-[#19324D] font-bold outline-none focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>

            {/* Search Box */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#71869B] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clients..."
                  className="text-xs pl-8 pr-3 py-1.5 bg-white border border-[#DFEAF2] rounded-lg text-[#19324D] outline-none focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 w-64 sm:w-80 shadow-2xs placeholder-[#71869B]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#71869B] hover:text-[#19324D]"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className="w-full overflow-x-auto border border-[#DFEAF2] rounded-lg shadow-xs bg-white">
            <table className="w-full min-w-[880px] text-xs text-left border-collapse">
              <thead className="bg-[#EAF3FB] text-[#19324D] text-[11px] font-bold uppercase tracking-wider border-b border-[#DFEAF2]">
                <tr>
                  <th className="py-3.5 px-4 border-r border-[#DFEAF2] min-w-[240px]">Client Profile</th>
                  <th className="py-3.5 px-4 border-r border-[#DFEAF2] min-w-[200px]">Contact Details</th>
                  <th className="py-3.5 px-4 border-r border-[#DFEAF2] min-w-[170px] whitespace-nowrap">Conversion Date</th>
                  <th className="py-3.5 px-4 border-r border-[#DFEAF2] min-w-[150px] whitespace-nowrap">Assigned Owner</th>
                  <th className="py-3.5 px-4 text-center min-w-[170px] whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFEAF2]">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-16 text-center text-[#71869B] bg-white">
                      <RefreshCw className="w-7 h-7 animate-spin mx-auto text-[#4689C8] mb-2" />
                      <p className="font-semibold text-xs">Loading clients...</p>
                    </td>
                  </tr>
                ) : paginatedLeads.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-16 text-center text-[#71869B] bg-white">
                      <UserCheck className="w-10 h-10 mx-auto text-[#71869B] mb-2 opacity-60" />
                      <h4 className="font-bold text-sm text-[#19324D]">No Clients Found</h4>
                      <p className="text-xs text-[#71869B] mt-1 max-w-sm mx-auto">
                        {searchQuery 
                          ? 'No client records match your search criteria. Try clearing the search query.'
                          : 'When leads reach "Won" status and are converted, they will appear here as active clients.'
                        }
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map((item, idx) => {
                    const isEven = idx % 2 === 0;
                    const waPhone = getCleanPhone(item.phone);
                    const companyName = item.converted_client_company || item.company_name;

                    return (
                      <tr 
                        key={item.id}
                        className={`transition-colors duration-150 ${
                          isEven ? 'bg-white' : 'bg-[#F8FAFD]'
                        } hover:bg-[#EAF3FB]`}
                      >
                        {/* 1. Client Profile */}
                        <td className="py-3.5 px-4 border-r border-[#DFEAF2]">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#EAF8F1] text-[#20A36B] font-bold flex items-center justify-center flex-shrink-0 border border-[#20A36B]/20 shadow-2xs">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-[#19324D] hover:text-[#4689C8] transition truncate">
                                {companyName || item.name}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF8F1] text-[#20A36B] border border-[#20A36B]/30">
                                  <UserCheck className="w-2.5 h-2.5" />
                                  <span>Client #{item.converted_client_number || 'Linked'}</span>
                                </span>
                                {item.lead_number && (
                                  <span 
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#EAF3FB] text-[#4689C8] border border-[#78A9D7]/30"
                                    title={`Origin Lead #${item.lead_number}`}
                                  >
                                    <Tag className="w-2.5 h-2.5" />
                                    <span>Lead #{item.lead_number}</span>
                                  </span>
                                )}
                                {companyName && item.name && (
                                  <span className="text-[11px] text-[#71869B] truncate">
                                    • {item.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Contact Details */}
                        <td className="py-3.5 px-4 border-r border-[#DFEAF2]">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-[#19324D] font-semibold">
                              <Phone className="w-3.5 h-3.5 text-[#71869B] flex-shrink-0" />
                              <span>{item.phone || '—'}</span>
                              {waPhone && (
                                <a
                                  href={`https://wa.me/${waPhone}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-[#20A36B] hover:opacity-80 transition ml-1"
                                  title="Chat on WhatsApp"
                                >
                                  <WhatsAppIcon className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                            {item.email && (
                              <div className="flex items-center gap-1.5 text-[11px] text-[#4689C8] truncate">
                                <Mail className="w-3.5 h-3.5 text-[#71869B] flex-shrink-0" />
                                <a href={`mailto:${item.email}`} className="hover:underline truncate" title={item.email}>
                                  {item.email}
                                </a>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 3. Conversion Date */}
                        <td className="py-3.5 px-4 border-r border-[#DFEAF2]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#EAF8F1] flex items-center justify-center flex-shrink-0 text-[#20A36B] border border-[#20A36B]/20">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#19324D]">
                                {formatDate(item.converted_at || item.updated_at)}
                              </div>
                              <div className="text-[10px] text-[#71869B] font-mono mt-0.5">
                                {formatTime(item.converted_at || item.updated_at)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 4. Assigned Owner */}
                        <td className="py-3.5 px-4 border-r border-[#DFEAF2]">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4F8FC] border border-[#DFEAF2] text-xs text-[#19324D] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#20A36B]"></span>
                            <span>{item.assigned_to_name || 'Admin'}</span>
                          </div>
                        </td>

                        {/* 5. Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5 flex-wrap">
                            <Link
                              href={`/projects?search=${encodeURIComponent(companyName || item.name || '')}`}
                              className="btn btn-sm inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#20A36B] bg-[#EAF8F1] hover:bg-[#20A36B] hover:text-white border border-[#20A36B]/30 rounded-md shadow-2xs transition cursor-pointer"
                              title="Open Client Projects & Contracts"
                            >
                              <FolderKanban className="w-3.5 h-3.5" />
                              <span>Projects</span>
                            </Link>

                            <Link
                              href={`/leads/view?id=${item.id}`}
                              className="btn btn-sm inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#4689C8] bg-[#EAF3FB] hover:bg-[#4689C8] hover:text-white border border-[#78A9D7]/40 rounded-md shadow-2xs transition cursor-pointer"
                              title="View Lead Pipeline Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lead</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Pagination Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#DFEAF2]">
            <div className="text-xs text-[#71869B]">
              Showing <strong className="text-[#19324D]">{totalItems > 0 ? startIndex + 1 : 0}</strong> to{' '}
              <strong className="text-[#19324D]">{endIndex}</strong> of{' '}
              <strong className="text-[#19324D]">{totalItems}</strong> clients
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 text-xs rounded-md border border-[#DFEAF2] bg-white text-[#19324D] hover:bg-[#EAF3FB] disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg)}
                    className={`px-3 py-1 text-xs rounded-md border transition cursor-pointer ${
                      currentPage === pg
                        ? 'bg-[#4689C8] border-[#4689C8] text-white font-bold shadow-xs'
                        : 'border-[#DFEAF2] bg-white text-[#71869B] hover:bg-[#EAF3FB] hover:text-[#19324D]'
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 text-xs rounded-md border border-[#DFEAF2] bg-white text-[#19324D] hover:bg-[#EAF3FB] disabled:opacity-40 transition cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

