import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { Mail, Send, Loader2, User, Inbox, SendHorizontal, Search, X, Paperclip, FileText, Download } from 'lucide-react';
import { cn } from '../lib/utils';

export function Messages() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [page, setPage] = useState(1);

  // Compose State
  const [recipientId, setRecipientId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  // Fetch employees for Compose dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'all'],
    queryFn: async () => {
      const res = await api.get('/employees', { params: { limit: 100 } });
      return res.data.data.records;
    },
    enabled: activeTab === 'compose'
  });

  const sortedEmployees = (employeesData || [])
    .slice()
    .sort((a: any, b: any) => a.firstName.localeCompare(b.firstName));

  const filteredEmployees = sortedEmployees.filter((emp: any) => 
    `${emp.firstName} ${emp.lastName} ${emp.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group employees alphabetically by first letter of first name
  const groupedEmployees = filteredEmployees.reduce((groups: Record<string, any[]>, emp: any) => {
    const letter = emp.firstName.charAt(0).toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(emp);
    return groups;
  }, {} as Record<string, any[]>);
  const alphabetGroups = Object.keys(groupedEmployees).sort();

  // Fetch Inbox
  const { data: inboxData, isLoading: isInboxLoading } = useQuery({
    queryKey: ['messages', 'inbox', page],
    queryFn: async () => {
      const res = await api.get('/messages/inbox', { params: { page, limit: 10 } });
      return res.data.data;
    },
    enabled: activeTab === 'inbox'
  });

  // Fetch Sent
  const { data: sentData, isLoading: isSentLoading } = useQuery({
    queryKey: ['messages', 'sent', page],
    queryFn: async () => {
      const res = await api.get('/messages/sent', { params: { page, limit: 10 } });
      return res.data.data;
    },
    enabled: activeTab === 'sent'
  });

  // Send Message Mutation — uses FormData so attachments can be sent as multipart
  const sendMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/messages/send', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setRecipientId('');
      setSubject('');
      setContent('');
      setAttachments([]);
      setActiveTab('sent');
      alert('Message sent successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to send message');
    }
  });

  // Read Message Mutation
  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.patch(`/messages/${id}/read`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'inbox'] });
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !subject || !content) return;
    const formData = new FormData();
    formData.append('recipientId', recipientId);
    formData.append('subject', subject);
    formData.append('content', content);
    attachments.forEach((file) => formData.append('attachments', file));
    sendMutation.mutate(formData);
  };

  const handleAttachFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files].slice(0, 5));
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-dark-900">Messages</h1>
        <button
          onClick={() => setActiveTab('compose')}
          className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700"
        >
          <Mail className="w-4 h-4 mr-2" />
          Compose New
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[600px] overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setActiveTab('inbox'); setPage(1); }}
            className={cn(
              "flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center transition-colors rounded-tl-xl",
              activeTab === 'inbox' ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            <Inbox className="w-4 h-4 mr-2" /> Inbox
          </button>
          <button
            onClick={() => { setActiveTab('sent'); setPage(1); }}
            className={cn(
              "flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center transition-colors",
              activeTab === 'sent' ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            )}
          >
            <SendHorizontal className="w-4 h-4 mr-2" /> Sent Messages
          </button>
        </div>

        {/* Compose View */}
        {activeTab === 'compose' && (
          <div className="p-6 max-w-3xl mx-auto w-full">
            <h2 className="text-lg font-medium text-dark-900 mb-6">Compose Message</h2>
            <form onSubmit={handleSend} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                {!recipientId ? (
                  <div className="relative">
                    <div className="flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
                      <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                      <input
                        type="text"
                        placeholder="Search employee by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                        className="w-full bg-transparent border-none focus:outline-none text-sm text-dark-900 placeholder:text-gray-400"
                      />
                    </div>
                    {showDropdown && (
                      <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-y-auto">
                        {filteredEmployees.length === 0 ? (
                          <div className="py-3 px-4 text-sm text-gray-500 text-center">No employees found.</div>
                        ) : (
                          alphabetGroups.map((letter) => (
                            <div key={letter}>
                              <div className="px-3 py-1 bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest sticky top-0">
                                {letter}
                              </div>
                              {groupedEmployees[letter].map((emp: any) => (
                                <div
                                  key={emp._id}
                                  onMouseDown={() => {
                                    setRecipientId(emp._id);
                                    setSearchQuery('');
                                    setShowDropdown(false);
                                  }}
                                  className="py-2 px-3 hover:bg-primary-50 cursor-pointer flex flex-col border-b border-gray-50 last:border-0"
                                >
                                  <span className="text-sm font-medium text-dark-900">{emp.firstName} {emp.lastName}</span>
                                  <span className="text-xs text-gray-500">{emp.email}</span>
                                </div>
                              ))}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between border border-gray-300 rounded-md py-2 px-3 shadow-sm bg-gray-50">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-dark-900">
                        {employeesData?.find((e: any) => e._id === recipientId)?.firstName} {employeesData?.find((e: any) => e._id === recipientId)?.lastName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {employeesData?.find((e: any) => e._id === recipientId)?.email}
                      </span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setRecipientId('')}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Message</label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm resize-none"
                />
              </div>

              {/* Attachments Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Attachments</label>
                  <label className="cursor-pointer text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center">
                    <Paperclip className="w-4 h-4 mr-1" />
                    Attach Files
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleAttachFiles}
                      accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                    />
                  </label>
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-md">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                          <div className="truncate">
                            <p className="text-sm font-medium text-dark-900 truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(idx)}
                          className="text-gray-400 hover:text-red-500 p-1 shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">Maximum 5 attachments allowed. Max size: 10MB per file.</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={sendMutation.isPending}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 flex items-center"
                >
                  {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  {sendMutation.isPending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Inbox View */}
        {activeTab === 'inbox' && (
          <div className="flex-1 overflow-auto bg-gray-50">
            {isInboxLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : inboxData?.records?.length === 0 ? (
              <div className="text-center p-12 text-gray-500">Your inbox is empty.</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {inboxData?.records?.map((msg: any) => (
                  <div
                    key={msg._id}
                    className={cn(
                      "p-6 transition-colors hover:bg-gray-100 cursor-pointer",
                      !msg.isRead ? "bg-white" : "bg-gray-50 opacity-75"
                    )}
                    onClick={() => {
                      if (!msg.isRead) readMutation.mutate(msg._id);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                          {msg.sender?.profileImage ? (
                            <img src={msg.sender.profileImage} alt="" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <User className="h-5 w-5 text-primary-600" />
                          )}
                        </div>
                        <div>
                          <p className={cn("text-sm text-dark-900", !msg.isRead ? "font-bold" : "font-medium")}>
                            {msg.sender?.firstName} {msg.sender?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{msg.sender?.role}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{formatDate(msg.createdAt)}</span>
                    </div>
                    <div className="ml-13">
                      <p className={cn("text-sm text-dark-900 mb-1", !msg.isRead ? "font-bold" : "font-medium")}>
                        {msg.subject}
                      </p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{msg.content}</p>
                      
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                            <Paperclip className="w-3 h-3 mr-1" />
                            {msg.attachments.length} Attachments
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {msg.attachments.map((file: any, idx: number) => (
                              <a
                                key={idx}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center p-2 pr-3 bg-white border border-gray-200 rounded-md hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center mr-3 group-hover:bg-primary-200 transition-colors">
                                  <FileText className="w-4 h-4 text-primary-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-dark-900 truncate max-w-[120px]" title={file.filename}>
                                    {file.filename}
                                  </p>
                                  <p className="text-[10px] text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                                <Download className="w-4 h-4 text-gray-400 ml-3 group-hover:text-primary-600 transition-colors" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sent View */}
        {activeTab === 'sent' && (
          <div className="flex-1 overflow-auto bg-gray-50">
            {isSentLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : sentData?.records?.length === 0 ? (
              <div className="text-center p-12 text-gray-500">You haven't sent any messages yet.</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {sentData?.records?.map((msg: any) => (
                  <div key={msg._id} className="p-6 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                          {msg.recipient?.profileImage ? (
                            <img src={msg.recipient.profileImage} alt="" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <User className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">To:</p>
                          <p className="text-sm font-medium text-dark-900">
                            {msg.recipient?.firstName} {msg.recipient?.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500 block">{formatDate(msg.createdAt)}</span>
                        <span className={cn("text-[10px] uppercase font-bold tracking-wider mt-1 block", msg.isRead ? "text-green-600" : "text-yellow-600")}>
                          {msg.isRead ? 'Read' : 'Unread'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-13">
                      <p className="text-sm font-medium text-dark-900 mb-1">{msg.subject}</p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{msg.content}</p>
                      
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                            <Paperclip className="w-3 h-3 mr-1" />
                            {msg.attachments.length} Attachments
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {msg.attachments.map((file: any, idx: number) => (
                              <a
                                key={idx}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center p-2 pr-3 bg-white border border-gray-200 rounded-md hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center mr-3 group-hover:bg-primary-200 transition-colors">
                                  <FileText className="w-4 h-4 text-primary-600" />
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-dark-900 truncate max-w-[120px]" title={file.filename}>
                                    {file.filename}
                                  </p>
                                  <p className="text-[10px] text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                                <Download className="w-4 h-4 text-gray-400 ml-3 group-hover:text-primary-600 transition-colors" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {((activeTab === 'inbox' && inboxData?.pages > 1) || (activeTab === 'sent' && sentData?.pages > 1)) && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between rounded-b-xl">
            <div className="flex space-x-2 ml-auto">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={(activeTab === 'inbox' ? page === inboxData?.pages : page === sentData?.pages)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
