"use client";

import { useState, useEffect } from "react";
import { Search, Download, RefreshCw, Clock, User, Globe } from "lucide-react";
import clsx from "clsx";
import { Table } from "@heroui/react";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface ActivityLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  description: string;
  ip: string;
  status: "success" | "error" | "warning" | "info";
  details?: string;
  action_type?: string;
}

// Sample Data
const SAMPLE_LOGS: ActivityLog[] = [
  {
    id: "log_1",
    timestamp: "2026-05-01 09:34:12",
    actor: "John Doe",
    action: "API Key Created",
    description: "New test API key was generated",
    ip: "102.88.104.23",
    status: "success",
    action_type: "api_key",
  },
  {
    id: "log_2",
    timestamp: "2026-04-30 14:22:45",
    actor: "System",
    action: "Webhook Updated",
    description: "Webhook URL changed for live mode",
    ip: "172.16.5.10",
    status: "success",
    action_type: "webhook",
  },
  {
    id: "log_3",
    timestamp: "2026-04-30 11:05:33",
    actor: "Jane Smith",
    action: "Login Attempt",
    description: "Failed login attempt from unknown device",
    ip: "197.210.45.67",
    status: "error",
    action_type: "login",
  },
  {
    id: "log_4",
    timestamp: "2026-04-29 16:48:09",
    actor: "John Doe",
    action: "IP Whitelist Added",
    description: "Added new IP to live key whitelist",
    ip: "102.88.104.23",
    status: "success",
    action_type: "api_key",
  },
];

// Status Badge
function StatusBadge({ status }: { status: ActivityLog["status"] }) {
  const styles = {
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
    error: "bg-red-100 text-red-700 border-red-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    info: "bg-blue-100 text-blue-700 border-blue-200",
  };

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
        styles[status],
      )}
    >
      <span>{icons[status]}</span>
      <span className="capitalize">{status}</span>
    </div>
  );
}

export default function ActivityLogs() {
  const [logs] = useState<ActivityLog[]>(SAMPLE_LOGS);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>(SAMPLE_LOGS);

  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const ACTION_TYPES = [
    { value: "all", label: "All Actions" },
    { value: "api_key", label: "API Keys" },
    { value: "webhook", label: "Webhooks" },
    { value: "login", label: "Login / Auth" },
  ];

  const STATUS_TYPES = [
    { value: "all", label: "All Statuses" },
    { value: "success", label: "Success" },
    { value: "error", label: "Error" },
    { value: "warning", label: "Warning" },
    { value: "info", label: "Info" },
  ];

  // Filtering Logic
  useEffect(() => {
    let result = [...logs];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((log) =>
        [log.description, log.actor, log.action, log.ip].some((field) =>
          field.toLowerCase().includes(q),
        ),
      );
    }

    if (actionFilter !== "all") {
      result = result.filter((log) => log.action_type === actionFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((log) => log.status === statusFilter);
    }

    setFilteredLogs(result);
  }, [logs, searchQuery, actionFilter, statusFilter]);

  const handleViewDetails = (log: ActivityLog) => setSelectedLog(log);
  const closeModal = () => setSelectedLog(null);

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          Activity Logs
        </h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">
          Track all important actions, security events, and configuration
          changes.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search logs by description, actor, action or IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3  border border-gray-200 rounded-2xl focus:border-violet-500 focus:ring-1 focus:ring-violet-200 outline-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-3  border border-gray-200 rounded-2xl text-sm focus:border-violet-500 outline-none w-full sm:w-auto"
          >
            {ACTION_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3  border border-gray-200 rounded-2xl text-sm focus:border-violet-500 outline-none w-full sm:w-auto"
          >
            {STATUS_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setSearchQuery("");
              setActionFilter("all");
              setStatusFilter("all");
            }}
            className="px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Reset Filters
          </button>

          <button className="sm:ml-auto flex items-center gap-2 px-5 py-3  border border-gray-200 hover:border-gray-300 rounded-2xl text-sm font-medium text-gray-700">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* HeroUI Table */}
      <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content
              aria-label="Activity Logs"
              className="min-w-[900px]" // Important for horizontal scroll on mobile
            >
              <Table.Header className={"rounded-sm"}>
                <Table.Column isRowHeader>Timestamp</Table.Column>
                <Table.Column>Actor</Table.Column>
                <Table.Column>Action</Table.Column>
                <Table.Column>Description</Table.Column>
                <Table.Column>IP Address</Table.Column>
                <Table.Column className={"text-center"}>Status</Table.Column>
              </Table.Header>

              <Table.Body>
                {filteredLogs.length === 0 ? (
                  <Table.Row>
                    <Table.Cell
                      colSpan={6}
                      className="py-20 text-center text-gray-500"
                    >
                      No matching activity logs found
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  filteredLogs.map((log) => (
                    <Table.Row
                      key={log.id}
                      onClick={() => handleViewDetails(log)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <Table.Cell>
                        <div className="flex items-center text-nowrap gap-2 text-sm text-gray-600">
                          <Clock size={15} className="text-gray-400" />
                          {log.timestamp}
                        </div>
                      </Table.Cell>

                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <User size={16} className="text-gray-500" />
                          </div>
                          <span className="text-nowrap font-medium text-gray-900">
                            {log.actor}
                          </span>
                        </div>
                      </Table.Cell>

                      <Table.Cell className="text-nowrap font-medium text-gray-800">
                        {log.action}
                      </Table.Cell>

                      <Table.Cell className="text-nowrap text-sm text-gray-600 max-w-xs">
                        {log.description}
                      </Table.Cell>

                      <Table.Cell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Globe size={15} className="text-gray-400" />
                          <span className="font-mono">{log.ip}</span>
                        </div>
                      </Table.Cell>

                      <Table.Cell>
                        <StatusBadge status={log.status} />
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>

        {/* Footer Info */}
        <div className="px-6 py-5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
          <p>
            Showing <strong>1–{filteredLogs.length}</strong> of{" "}
            <strong>{filteredLogs.length}</strong> logs
          </p>
          <p className="text-xs text-gray-400 mt-2 sm:mt-0">
            Activity logs are retained for <strong>90 days</strong>.
          </p>
        </div>
      </div>

      {/* Detail Modal - Same as before */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className=" rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden">
            {/* Modal content remains the same as previous version */}
            <div className="px-8 pt-6 pb-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Activity Details</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedLog.timestamp}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                    Actor
                  </p>
                  <p className="font-medium">{selectedLog.actor}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                    IP Address
                  </p>
                  <p className="font-mono text-sm">{selectedLog.ip}</p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                  Action
                </p>
                <p className="font-semibold text-lg">{selectedLog.action}</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                  Description
                </p>
                <p className="text-gray-700 leading-relaxed">
                  {selectedLog.description}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
                  Status
                </p>
                <StatusBadge status={selectedLog.status} />
              </div>
            </div>

            <div className="px-8 py-5 border-t bg-gray-50 flex justify-end">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 bg-gray-900 text-white rounded-2xl font-medium hover:bg-black transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
