"use client";

import {
  RiSearchLine,
  RiRefreshLine,
  RiShieldCheckLine,
  RiErrorWarningLine,
  RiInformationLine,
  RiAlertLine,
  RiFilterLine,
  RiCalendarLine,
} from "react-icons/ri";
import { Table } from "@heroui/react";
import { useState, useEffect, useCallback, useRef } from "react";
import React from "react";

interface LogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  description: string;
  ip: string;
  status: "success" | "error" | "warning" | "info";
  details: string | null;
}

interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractLogs(data: any): LogEntry[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  return [];
}

const ACTION_FILTERS = [
  { value: "all", label: "All Actions" },
  { value: "user", label: "User" },
  { value: "api_key", label: "API Key" },
  { value: "webhook", label: "Webhook" },
  { value: "business", label: "Business" },
  { value: "transaction", label: "Transaction" },
  { value: "ip_whitelist", label: "IP Whitelist" },
];

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "success", label: "Success" },
  { value: "error", label: "Error" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
];

const DATE_FILTERS = [
  { value: "all", label: "All Time" },
  { value: "last7days", label: "Last 7 days" },
  { value: "last30days", label: "Last 30 days" },
  { value: "this_month", label: "This month" },
];

const PER_PAGE = 20;

function formatTimestamp(ts: string): { date: string; time: string } {
  const d = new Date(ts);
  return {
    date: d.toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };
}

function StatusBadge({ status }: { status: LogEntry["status"] }) {
  const config: Record<
    LogEntry["status"],
    { cls: string; icon: React.ReactNode; label: string }
  > = {
    success: {
      cls: "bg-green-50 text-green-700",
      icon: <RiShieldCheckLine size={12} />,
      label: "Success",
    },
    error: {
      cls: "bg-red-50 text-red-700",
      icon: <RiErrorWarningLine size={12} />,
      label: "Error",
    },
    warning: {
      cls: "bg-amber-50 text-amber-700",
      icon: <RiAlertLine size={12} />,
      label: "Warning",
    },
    info: {
      cls: "bg-blue-50 text-blue-700",
      icon: <RiInformationLine size={12} />,
      label: "Info",
    },
  };
  const { cls, icon, label } = config[status] ?? config.info;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}
    >
      {icon}
      {label}
    </span>
  );
}

function ActionBadge({ action }: { action: string }) {
  const prefix = action.split(".")[0] ?? action;
  const colors: Record<string, string> = {
    user: "bg-purple-50 text-purple-700",
    api_key: "bg-indigo-50 text-indigo-700",
    webhook: "bg-cyan-50 text-cyan-700",
    business: "bg-orange-50 text-orange-700",
    transaction: "bg-green-50 text-green-700",
    ip_whitelist: "bg-pink-50 text-pink-700",
  };
  const cls = colors[prefix] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-md text-xs font-mono font-medium ${cls}`}
    >
      {action}
    </span>
  );
}

export default function ActivityLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        per_page: String(PER_PAGE),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (actionFilter !== "all") params.set("action", actionFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (dateFilter !== "all") params.set("date_range", dateFilter);

      const res = await fetch(`/api/logs?${params.toString()}`);

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load activity logs");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json: any = await res.json();
      setLogs(extractLogs(json.data));
      setMeta(json.meta ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, actionFilter, statusFilter, dateFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setCurrentPage(1);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const handleFilter = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const totalPages = meta?.last_page ?? 1;

  return (
    <div className="w-full flex h-full flex-col items-center pt-5 sm:pt-10 pb-5 sm:pb-8">
      <div className="max-w-310 flex flex-col gap-6 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-center mt-4">
          <div className="">
            <h1 className="text-[26px] md:text-[30px] font-bold text-gray-900 tracking-tight">
              Activity Logs
            </h1>
            <p className="text-[14px] text-gray-500 mt-1">
              Track all actions and events on your account
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RiRefreshLine
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col gap-3">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by action, IP address, or user..."
              className="px-10 py-2 rounded-full bg-white outline-none w-full border border-gray-200 focus:border-gray-400 text-sm"
            />
          </div>

          {/* Filter rows */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Action filter */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5">
              <RiFilterLine size={14} className="text-gray-400" />
              <select
                value={actionFilter}
                onChange={(e) => handleFilter(setActionFilter)(e.target.value)}
                className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer"
              >
                {ACTION_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleFilter(setStatusFilter)(s.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === s.value
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Date range */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 ml-auto">
              <RiCalendarLine size={14} className="text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => handleFilter(setDateFilter)(e.target.value)}
                className="text-sm text-gray-700 bg-transparent outline-none cursor-pointer"
              >
                {DATE_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={fetchLogs} className="underline text-red-600 ml-4">
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <Table variant="secondary" aria-label="Activity Logs Table">
          <Table.ScrollContainer>
            <Table.Content>
              <Table.Header>
                <Table.Column isRowHeader>TIMESTAMP</Table.Column>
                <Table.Column>ACTION</Table.Column>
                <Table.Column>DESCRIPTION</Table.Column>
                <Table.Column>ACTOR</Table.Column>
                <Table.Column>IP ADDRESS</Table.Column>
                <Table.Column>STATUS</Table.Column>
              </Table.Header>
              <Table.Body>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <Table.Row key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <Table.Cell key={j}>
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-full max-w-[140px]" />
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))
                ) : logs.length === 0 ? (
                  <Table.Row>
                    <Table.Cell
                      colSpan={6}
                      className="text-center py-12 text-gray-400 text-sm"
                    >
                      No activity logs found
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  logs.map((log) => {
                    const { date, time } = formatTimestamp(log.timestamp);
                    const isExpanded = expandedRow === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <Table.Row
                          key={log.id}
                          className={`cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? "bg-gray-50" : ""}`}
                          onClick={() =>
                            setExpandedRow(isExpanded ? null : log.id)
                          }
                        >
                          <Table.Cell>
                            <div>
                              <p className="text-sm font-medium text-gray-900 text-nowrap">
                                {date}
                              </p>
                              <p className="text-xs text-gray-400 font-mono">
                                {time}
                              </p>
                            </div>
                          </Table.Cell>

                          <Table.Cell>
                            <ActionBadge action={log.action} />
                          </Table.Cell>

                          <Table.Cell>
                            <p className="text-sm text-gray-700 max-w-xs truncate">
                              {log.description || "—"}
                            </p>
                          </Table.Cell>

                          <Table.Cell>
                            <p className="text-sm text-gray-700 text-nowrap">
                              {log.actor}
                            </p>
                          </Table.Cell>

                          <Table.Cell>
                            <p className="text-sm font-mono text-gray-500 text-nowrap">
                              {log.ip}
                            </p>
                          </Table.Cell>

                          <Table.Cell>
                            <StatusBadge status={log.status} />
                          </Table.Cell>
                        </Table.Row>

                        {/* Expanded details row */}
                        {isExpanded && log.details && (
                          <Table.Row key={`${log.id}-details`}>
                            <Table.Cell colSpan={6}>
                              <div className="py-2 px-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 font-medium mb-1.5 uppercase tracking-wide">
                                  Details
                                </p>
                                <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap break-all bg-white border border-gray-100 rounded-lg p-3 max-h-48 overflow-auto">
                                  {(() => {
                                    try {
                                      return JSON.stringify(
                                        JSON.parse(log.details),
                                        null,
                                        2,
                                      );
                                    } catch {
                                      return log.details;
                                    }
                                  })()}
                                </pre>
                              </div>
                            </Table.Cell>
                          </Table.Row>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>

        {/* Pagination */}
        {!loading && totalPages > 1 && meta && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4">
            <p className="text-sm text-gray-500">
              Showing {meta.from ?? 0}–{meta.to ?? 0} of {meta.total} logs
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1,
                )
                .reduce<(number | "...")[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setCurrentPage(item as number)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        item === currentPage
                          ? "bg-gray-900 text-white border-gray-900"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        <div className="h-10" />
      </div>
    </div>
  );
}
