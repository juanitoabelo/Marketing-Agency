import { useEffect, useState } from 'react';

interface AuditRow {
  id: string;
  clientId: string;
  clientName: string;
  date: string;
  pageSpeed: { desktop: number; mobile: number };
  coreVitals: { LCP: number; FID: number; CLS: number };
  metadata: { title: boolean; description: boolean; keywords: boolean };
  issuesCount: number;
}

interface SEOAuditsTableProps {
  audits: AuditRow[];
  onView: (id: string) => void;
}

export default function SEOAuditsTable({ audits, onView }: SEOAuditsTableProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVitalsIcon = (value: number, goodThreshold: number) => {
    return value <= goodThreshold ? '✅' : '⚠️';
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Client
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Speed (D/M)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Core Vitals
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Metadata
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Issues
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {audits.map((audit) => (
            <tr key={audit.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{audit.clientName}</div>
                <div className="text-sm text-gray-500">{audit.clientId}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(audit.date).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`text-sm font-medium ${getScoreColor(audit.pageSpeed.desktop)}`}>
                  {audit.pageSpeed.desktop}
                </span>
                {' / '}
                <span className={`text-sm font-medium ${getScoreColor(audit.pageSpeed.mobile)}`}>
                  {audit.pageSpeed.mobile}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span title="LCP">{getVitalsIcon(audit.coreVitals.LCP, 2.5)}</span>
                {' '}
                <span title="FID">{getVitalsIcon(audit.coreVitals.FID, 100)}</span>
                {' '}
                <span title="CLS">{getVitalsIcon(audit.coreVitals.CLS, 0.1)}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span className={audit.metadata.title ? 'text-green-600' : 'text-yellow-600'}>
                  Title {audit.metadata.title ? '✅' : '⚠️'}
                </span>
                {' '}
                <span className={audit.metadata.description ? 'text-green-600' : 'text-yellow-600'}>
                  Desc {audit.metadata.description ? '✅' : '⚠️'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  audit.issuesCount === 0 ? 'bg-green-100 text-green-800' :
                  audit.issuesCount < 5 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {audit.issuesCount}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => onView(audit.id)}
                  className="text-blue-600 hover:text-blue-900 font-medium"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
