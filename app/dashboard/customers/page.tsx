"use client";

import {
  RiSearchLine,
  RiFilter3Line,
  RiUserAddLine,
  RiMoreFill,
  RiUserLine,
  RiUserFollowLine,
  RiCloseLine,
  RiPhoneLine,
  RiMailLine,
  RiBankCardLine,
  RiCalendarLine,
  RiTimeLine,
} from "react-icons/ri";
import { Avatar, Button, Table } from "@heroui/react";
import { useState, useMemo } from "react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  accountNo: string;
  status: "active" | "inactive" | "suspended";
  totalTransactions: number;
  balance: string;
  joinedDate: string;
  lastActive: string;
  dp: string;
}

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: "CUST-10001",
    name: "Adebayo Chukwudi",
    email: "adebayo.chukwudi@gmail.com",
    phone: "+234 803 456 7890",
    accountNo: "9987654321",
    status: "active",
    totalTransactions: 24,
    balance: "₦3,695,800",
    joinedDate: "Mar 12, 2025",
    lastActive: "Apr 28, 2026",
    dp: "https://img.heroui.chat/image/avatar?w=400&h=400&u=9",
  },
  {
    id: "CUST-10002",
    name: "Fatima Okonkwo",
    email: "fatima.okonkwo@yahoo.com",
    phone: "+234 809 123 4567",
    accountNo: "9987654320",
    status: "active",
    totalTransactions: 18,
    balance: "₦1,245,800",
    joinedDate: "Jan 05, 2025",
    lastActive: "Apr 27, 2026",
    dp: "https://img.heroui.chat/image/avatar?w=400&h=400&u=10",
  },
  {
    id: "CUST-10003",
    name: "Emmanuel Okafor",
    email: "emmanuel.okafor@hotmail.com",
    phone: "+234 701 987 6543",
    accountNo: "9987654319",
    status: "active",
    totalTransactions: 31,
    balance: "₦2,138,250",
    joinedDate: "Nov 20, 2024",
    lastActive: "Apr 26, 2026",
    dp: "https://img.heroui.chat/image/avatar?w=400&h=400&u=11",
  },
  {
    id: "CUST-10004",
    name: "Aisha Bello",
    email: "aisha.bello@outlook.com",
    phone: "+234 905 234 5678",
    accountNo: "9987654318",
    status: "inactive",
    totalTransactions: 12,
    balance: "₦638,250",
    joinedDate: "Feb 14, 2025",
    lastActive: "Apr 20, 2026",
    dp: "https://img.heroui.chat/image/avatar?w=400&h=400&u=12",
  },
  {
    id: "CUST-10005",
    name: "Chinedu Eze",
    email: "chinedu.eze@gmail.com",
    phone: "+234 803 111 2222",
    accountNo: "9987654317",
    status: "active",
    totalTransactions: 45,
    balance: "₦4,872,100",
    joinedDate: "Oct 01, 2024",
    lastActive: "Apr 29, 2026",
    dp: "https://img.heroui.chat/image/avatar?w=400&h=400&u=13",
  },
  {
    id: "CUST-10006",
    name: "Ngozi Adeyemi",
    email: "ngozi.adeyemi@gmail.com",
    phone: "+234 812 345 6789",
    accountNo: "9987654316",
    status: "active",
    totalTransactions: 9,
    balance: "₦980,000",
    joinedDate: "Apr 01, 2026",
    lastActive: "Apr 29, 2026",
    dp: "https://img.heroui.chat/image/avatar?w=400&h=400&u=14",
  },
  {
    id: "CUST-10007",
    name: "Tunde Bakare",
    email: "tunde.bakare@yahoo.com",
    phone: "+234 706 789 0123",
    accountNo: "9987654315",
    status: "suspended",
    totalTransactions: 3,
    balance: "₦45,000",
    joinedDate: "Dec 10, 2024",
    lastActive: "Feb 14, 2026",
    dp: "https://img.heroui.chat/image/avatar?w=400&h=400&u=15",
  },
  {
    id: "CUST-10008",
    name: "Chidinma Obi",
    email: "chidinma.obi@outlook.com",
    phone: "+234 901 234 5678",
    accountNo: "9987654314",
    status: "active",
    totalTransactions: 27,
    balance: "₦2,560,400",
    joinedDate: "Sep 15, 2024",
    lastActive: "Apr 28, 2026",
    dp: "https://img.heroui.chat/image/avatar?w=400&h=400&u=16",
  },
  {
    id: "CUST-10009",
    name: "Emeka Nwosu",
    email: "emeka.nwosu@gmail.com",
    phone: "+234 813 456 7890",
    accountNo: "9987654313",
    status: "inactive",
    totalTransactions: 6,
    balance: "₦120,750",
    joinedDate: "Mar 28, 2025",
    lastActive: "Mar 10, 2026",
    dp: "https://img.heroui.chat/image/avatar?w=400&h=400&u=17",
  },
  {
    id: "CUST-10010",
    name: "Halima Yusuf",
    email: "halima.yusuf@gmail.com",
    phone: "+234 802 345 6789",
    accountNo: "9987654312",
    status: "active",
    totalTransactions: 52,
    balance: "₦6,340,200",
    joinedDate: "Jul 22, 2024",
    lastActive: "Apr 30, 2026",
    dp: "https://img.heroui.chat/image/avatar?w=400&h=400&u=18",
  },
  {
    id: "CUST-10011",
    name: "Segun Lawal",
    email: "segun.lawal@hotmail.com",
    phone: "+234 908 567 8901",
    accountNo: "9987654311",
    status: "active",
    totalTransactions: 14,
    balance: "₦870,500",
    joinedDate: "Jun 05, 2025",
    lastActive: "Apr 25, 2026",
    dp: "https://img.heroui.chat/image/avatar?w=400&h=400&u=19",
  },
  {
    id: "CUST-10012",
    name: "Blessing Onyekachi",
    email: "blessing.o@yahoo.com",
    phone: "+234 705 678 9012",
    accountNo: "9987654310",
    status: "active",
    totalTransactions: 33,
    balance: "₦3,110,900",
    joinedDate: "Aug 18, 2024",
    lastActive: "Apr 29, 2026",
    dp: "https://img.heroui.chat/image/avatar?w=400&h=400&u=20",
  },
];

const STATUS_FILTERS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

const ITEMS_PER_PAGE = 8;

function StatusBadge({ status }: { status: Customer["status"] }) {
  const styles: Record<Customer["status"], string> = {
    active: "bg-green-50 text-green-600",
    inactive: "bg-gray-100 text-gray-600",
    suspended: "bg-red-50 text-red-600",
  };
  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function CustomerModal({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Customer Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        {/* Profile Hero */}
        <div className="flex flex-col items-center py-6 px-5 bg-gray-50 border-b border-gray-100">
          <Avatar className="w-16 h-16 mb-3">
            <Avatar.Image src={customer.dp} alt={customer.name} />
            <Avatar.Fallback className="text-lg">
              {customer.name.charAt(0)}
            </Avatar.Fallback>
          </Avatar>
          <h3 className="font-semibold text-gray-900 text-lg">
            {customer.name}
          </h3>
          <p className="text-sm text-gray-500 mb-3">{customer.id}</p>
          <StatusBadge status={customer.status} />
        </div>

        {/* Details */}
        <div className="px-5 py-4 space-y-3">
          {[
            {
              icon: <RiMailLine size={15} />,
              label: "Email",
              value: customer.email,
            },
            {
              icon: <RiPhoneLine size={15} />,
              label: "Phone",
              value: customer.phone,
            },
            {
              icon: <RiBankCardLine size={15} />,
              label: "Account No.",
              value: customer.accountNo,
              mono: true,
            },
            {
              icon: <RiUserLine size={15} />,
              label: "Balance",
              value: customer.balance,
              green: true,
            },
            {
              icon: <RiUserLine size={15} />,
              label: "Total Transactions",
              value: String(customer.totalTransactions),
            },
            {
              icon: <RiCalendarLine size={15} />,
              label: "Joined",
              value: customer.joinedDate,
            },
            {
              icon: <RiTimeLine size={15} />,
              label: "Last Active",
              value: customer.lastActive,
            },
          ].map(({ icon, label, value, mono, green }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2 text-gray-500 shrink-0">
                {icon}
                <span className="text-sm">{label}</span>
              </div>
              <span
                className={`text-sm text-right ${
                  mono
                    ? "font-mono text-gray-700"
                    : green
                      ? "font-semibold text-green-600"
                      : "text-gray-900"
                }`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <Button variant="outline" className="flex-1">
            View Transactions
          </Button>
          <Button className="flex-1 bg-black text-white">Edit Customer</Button>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return MOCK_CUSTOMERS.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.accountNo.includes(q) ||
        c.phone.includes(q);
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  const totalCustomers = MOCK_CUSTOMERS.length;
  const activeCustomers = MOCK_CUSTOMERS.filter(
    (c) => c.status === "active",
  ).length;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="w-full flex h-full flex-col items-center">
      <div className="max-w-310 flex flex-col gap-6 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-start md:items-center mt-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage all your banking customers
            </p>
          </div>
          <Button className="flex items-center gap-2 bg-black text-white">
            <RiUserAddLine size={18} />
            Add Customer
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <RiUserLine className="text-blue-600" size={28} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalCustomers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <RiUserFollowLine className="text-green-600" size={28} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Customers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {activeCustomers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
          <div className="relative w-full md:max-w-md">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search by name, email or account number..."
              className="px-10 py-2 rounded-full bg-white outline-none w-full border border-gray-200 focus:border-gray-400 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s.value}
                onClick={() => handleStatusFilter(s.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === s.value
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customers Table */}
        <Table variant="secondary" aria-label="Customers Table">
          <Table.ScrollContainer>
            <Table.Content>
              <Table.Header>
                <Table.Column isRowHeader>CUSTOMER</Table.Column>
                <Table.Column>ACCOUNT NO</Table.Column>
                <Table.Column>BALANCE</Table.Column>
                <Table.Column>TRANSACTIONS</Table.Column>
                <Table.Column>STATUS</Table.Column>
                <Table.Column>JOINED</Table.Column>
                <Table.Column className="text-right">ACTIONS</Table.Column>
              </Table.Header>
              <Table.Body>
                {paginatedCustomers.length === 0 ? (
                  <Table.Row>
                    <Table.Cell
                      colSpan={7}
                      className="text-center py-12 text-gray-400 text-sm"
                    >
                      No customers match your search
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  paginatedCustomers.map((customer) => (
                    <Table.Row
                      key={customer.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <Avatar.Image
                              src={customer.dp}
                              alt={customer.name}
                            />
                            <Avatar.Fallback>
                              {customer.name.charAt(0)}
                            </Avatar.Fallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-nowrap">
                              {customer.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {customer.email}
                            </p>
                          </div>
                        </div>
                      </Table.Cell>

                      <Table.Cell>
                        <p className="font-mono text-sm text-gray-600 text-nowrap">
                          {customer.accountNo}
                        </p>
                      </Table.Cell>

                      <Table.Cell>
                        <p className="font-medium text-green-600 text-nowrap">
                          {customer.balance}
                        </p>
                      </Table.Cell>

                      <Table.Cell>
                        <p className="text-sm font-medium">
                          {customer.totalTransactions}
                        </p>
                      </Table.Cell>

                      <Table.Cell>
                        <StatusBadge status={customer.status} />
                      </Table.Cell>

                      <Table.Cell className="text-sm text-nowrap text-gray-500">
                        {customer.joinedDate}
                      </Table.Cell>

                      <Table.Cell className="text-right">
                        <Button
                          variant="outline"
                          isIconOnly
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(customer);
                          }}
                        >
                          <RiMoreFill size={20} />
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4">
            <p className="text-sm text-gray-500">
              Showing{" "}
              {Math.min(
                (currentPage - 1) * ITEMS_PER_PAGE + 1,
                filteredCustomers.length,
              )}
              –
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)}{" "}
              of {filteredCustomers.length} customers
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      page === currentPage
                        ? "bg-gray-900 text-white border-gray-900"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {page}
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

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}
