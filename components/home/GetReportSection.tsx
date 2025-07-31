'use client';

import Link from 'next/link';
import { useState, FormEvent } from 'react';

interface ReportSearchResult {
  id: string;
  reportIdNumber: string;
  clientName?: string; // Assuming clientName might be part of the result
  createdAt: string; // Or Date, adjust as per your API response
}

export default function GetReportSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [reports, setReports] = useState<ReportSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!searchQuery.trim()) {
      setError('Client phone number cannot be empty.');
      setReports([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setReports([]);
    setHasSearched(true);

    try {
      // IMPORTANT: Replace with your actual API endpoint
      const response = await fetch(`/api/reports/search?clientPhoneNumber=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch reports. Please try again.' }));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      const data: ReportSearchResult[] = await response.json();
      setReports(data);
      if (data.length === 0) {
        // You can set a specific message here if needed, or rely on conditional rendering
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gray-50 dark:bg-gray-800">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-900 dark:text-white">
            Get Your Report
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Enter your client phone number to find and download your report.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mt-8 max-w-md mx-auto">
          <div className="flex gap-x-4">
            <label htmlFor="client-phone-number" className="sr-only">
              Client Phone Number
            </label>
            <input
              id="client-phone-number"
              name="client-phone-number"
              type="tel"
              autoComplete="tel"
              required
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-0 flex-auto rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3.5 py-2 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              placeholder="Enter your client phone number"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="flex-none rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        <div className="mt-8 max-w-2xl mx-auto">
          {isLoading && (
            <div className="text-center py-4">
              <p className="text-gray-700 dark:text-gray-300">Loading reports...</p>
              {/* You can add a spinner here */}
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <p>Error: {error}</p>
            </div>
          )}

          {hasSearched && !isLoading && !error && reports.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
              <p>No reports found for the provided client number.</p>
            </div>
          )}

          {reports.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Search Results:</h3>
              <ul className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-md">
                {reports.map((report) => (
                  <li key={report.id} className="p-4 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <Link href={`/dashboard/reports/${report.id}`} className="block">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-indigo-600 dark:text-indigo-400 font-medium">
                            Report ID: {report.reportIdNumber}
                          </p>
                          {report.clientName && (
                             <p className="text-sm text-gray-600 dark:text-gray-400">
                              Client: {report.clientName}
                            </p>
                          )}
                           <p className="text-sm text-gray-500 dark:text-gray-400">
                            Date: {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200">
                          View Report &rarr;
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
