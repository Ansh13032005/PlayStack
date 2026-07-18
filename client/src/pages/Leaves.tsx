import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import { CalendarOff, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';

export function Leaves() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  
  // Apply Leave form state
  const [isApplying, setIsApplying] = useState(false);
  const [leaveType, setLeaveType] = useState('Casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState<'Morning' | 'Afternoon'>('Morning');
  
  const isAdminOrHR = user?.role === 'Super Admin' || user?.role === 'HR Manager';

  // Apply Leave Mutation
  const applyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/leaves/apply', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setIsApplying(false);
      setStartDate('');
      setEndDate('');
      setReason('');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to apply for leave');
    }
  });

  // Review Leave Mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await api.patch(`/leaves/${id}/review`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to review leave');
    }
  });

  // Cancel Leave Mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/leaves/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to cancel leave');
    }
  });

  // History query
  const queryEndpoint = isAdminOrHR ? '/leaves/all' : '/leaves/me';
  
  const { data, isLoading } = useQuery({
    queryKey: ['leaves', 'history', page, statusFilter],
    queryFn: async () => {
      const params: any = { page, limit: 10 };
      if (isAdminOrHR && statusFilter) params.status = statusFilter;
      
      const res = await api.get(queryEndpoint, { params });
      return res.data.data;
    }
  });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || (!isHalfDay && !endDate) || !reason) return;
    
    const start = new Date(startDate);
    const end = isHalfDay ? start : new Date(endDate);
    const totalDays = isHalfDay ? 0.5 : (Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    
    applyMutation.mutate({
      leaveType,
      startDate,
      endDate: isHalfDay ? startDate : endDate,
      totalDays,
      reason,
      isHalfDay,
      halfDaySession: isHalfDay ? halfDaySession : undefined,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-dark-900">Leave Management</h1>
        
        {!isAdminOrHR && (
          <button
            onClick={() => setIsApplying(!isApplying)}
            className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <CalendarOff className="w-4 h-4 mr-2" />
            {isApplying ? 'Cancel Application' : 'Apply for Leave'}
          </button>
        )}
      </div>

      {isApplying && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-medium text-dark-900 mb-4">New Leave Request</h2>
          <form onSubmit={handleApply} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="Casual">Casual</option>
                  <option value="Sick">Sick</option>
                  <option value="Earned">Earned</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              {!isHalfDay && (
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              )}
            </div>

            {/* Half Day Toggle */}
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => { setIsHalfDay(!isHalfDay); if (!isHalfDay) setEndDate(''); }}
                  className={cn(
                    'relative w-10 h-5 rounded-full transition-colors duration-200',
                    isHalfDay ? 'bg-primary-500' : 'bg-gray-300'
                  )}
                >
                  <div className={cn(
                    'absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
                    isHalfDay ? 'translate-x-5' : 'translate-x-0'
                  )} />
                </div>
                <span className="text-sm font-medium text-gray-700">Half Day Leave</span>
              </label>
              {isHalfDay && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Session:</span>
                  <button
                    type="button"
                    onClick={() => setHalfDaySession('Morning')}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-md border transition-colors',
                      halfDaySession === 'Morning'
                        ? 'bg-primary-100 border-primary-400 text-primary-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    )}
                  >Morning</button>
                  <button
                    type="button"
                    onClick={() => setHalfDaySession('Afternoon')}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-md border transition-colors',
                      halfDaySession === 'Afternoon'
                        ? 'bg-primary-100 border-primary-400 text-primary-700'
                        : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    )}
                  >Afternoon</button>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={applyMutation.isPending}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {applyMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[500px]">
        {isAdminOrHR && (
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-4 rounded-t-xl">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status Filter:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="block pl-3 pr-8 py-1.5 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {isAdminOrHR && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Reason
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdminOrHR ? 5 : 3} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
                  </td>
                </tr>
              ) : data?.records?.length === 0 ? (
                <tr>
                  <td colSpan={isAdminOrHR ? 5 : 3} className="px-6 py-12 text-center text-gray-500">
                    No leave records found.
                  </td>
                </tr>
              ) : (
                data?.records?.map((record: any) => (
                  <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                    {isAdminOrHR && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-900">
                        {record.employee?.firstName} {record.employee?.lastName}
                        <div className="text-xs text-gray-500">{record.employee?.email}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-dark-900">{record.leaveType}</div>
                      <div className="text-sm text-gray-500">{record.reason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-dark-900">
                        {formatDate(record.startDate)} - {formatDate(record.endDate)}
                      </div>
                      <div className="text-sm text-gray-500">{record.totalDays} days</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md border",
                        record.status === 'Approved' ? "bg-green-50 text-green-700 border-green-200" : 
                        record.status === 'Pending' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                        "bg-red-50 text-red-700 border-red-200"
                      )}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isAdminOrHR ? (
                        record.status === 'Pending' && (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => reviewMutation.mutate({ id: record._id, status: 'Approved' })}
                              disabled={reviewMutation.isPending}
                              className="text-green-600 hover:text-green-900 bg-green-50 p-1.5 rounded"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => reviewMutation.mutate({ id: record._id, status: 'Rejected' })}
                              disabled={reviewMutation.isPending}
                              className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded"
                              title="Reject"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        )
                      ) : (
                        record.status === 'Pending' && (
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to cancel this leave request?')) {
                                cancelMutation.mutate(record._id);
                              }
                            }}
                            disabled={cancelMutation.isPending}
                            className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded text-xs font-medium"
                          >
                            {cancelMutation.isPending && cancelMutation.variables === record._id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between rounded-b-xl">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(page * 10, data.total)}</span> of <span className="font-medium">{data.total}</span> results
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
