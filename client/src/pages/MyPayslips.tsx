import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/axios';
import { Loader2, Download } from 'lucide-react';

export function MyPayslips() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['my-payslips', page],
    queryFn: async () => {
      const res = await api.get(`/payroll/me?page=${page}&limit=10`);
      return res.data.data;
    }
  });

  const handleDownload = (record: any) => {
    // In a real app, this would generate a PDF. For now, we'll just show an alert.
    alert(`Downloading payslip for ${record.month}/${record.year}...\nNet Pay: ₹${record.netPay.toLocaleString(undefined, { maximumFractionDigits: 0 })}`);
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-900">My Payslips</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto flex-1 p-6">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : data?.records?.length === 0 ? (
            <div className="text-center p-12 text-gray-500">
              No payslips found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.records?.map((record: any) => (
                <div key={record._id} className="border border-gray-200 rounded-lg p-5 hover:border-primary-300 transition-colors bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-dark-900">
                      {new Date(0, record.month - 1).toLocaleString('default', { month: 'long' })} {record.year}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      record.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Gross Salary</span>
                      <span className="font-medium">₹{record.baseSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Unpaid Leaves</span>
                      <span className="font-medium text-red-600">{record.unpaidLeaveDays} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Half Days</span>
                      <span className="font-medium text-red-600">{record.halfDays} days</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-200 pt-3">
                      <span className="font-bold text-dark-900">Net Pay</span>
                      <span className="font-bold text-green-600 text-lg">
                        ₹{record.netPay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(record)}
                    disabled={record.status !== 'Paid'}
                    className="w-full flex items-center justify-center px-4 py-2 border border-primary-600 text-primary-600 rounded-md hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {data?.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between rounded-b-xl">
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
                disabled={page === data?.pages}
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
