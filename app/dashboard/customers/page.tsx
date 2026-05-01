"use client";

import {
  RiSearchLine,
  RiFilter3Line,
  RiUserAddLine,
  RiMoreFill,
  RiUserLine,
  RiUserFollowLine,
} from "react-icons/ri";
import { Avatar, Button, Input, Table, Modal, Pagination } from "@heroui/react";
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

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const itemsPerPage = 10;

  const customers: Customer[] = [
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
  ];

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.accountNo.includes(searchTerm),
    );
  }, [searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage]);

  const openCustomerModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.status === "active").length;

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
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full md:max-w-md">
            <div className="relative w-full md:max-w-md">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

              <input
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                placeholder="Search by name, email or account number..."
                className="px-10 py-2 rounded-full bg-white outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <RiFilter3Line size={18} />
              Filter
            </Button>
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
                {paginatedCustomers.map((customer) => (
                  <Table.Row
                    key={customer.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => openCustomerModal(customer)}
                  >
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <Avatar.Image
                            sizes="sm"
                            alt="John Doe"
                            src={customer.dp}
                          />
                          <Avatar.Fallback>
                            {customer.name.charAt(0)}
                          </Avatar.Fallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-xs text-gray-500">
                            {customer.email}
                          </p>
                        </div>
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <p className="font-mono text-sm text-gray-600">
                        {customer.accountNo}
                      </p>
                    </Table.Cell>

                    <Table.Cell>
                      <p className="font-medium text-green-600">
                        {customer.balance}
                      </p>
                    </Table.Cell>

                    <Table.Cell>
                      <p className="text-sm font-medium">
                        {customer.totalTransactions}
                      </p>
                    </Table.Cell>

                    <Table.Cell>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          customer.status === "active"
                            ? "bg-green-50 text-green-600"
                            : customer.status === "inactive"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-red-50 text-red-600"
                        }`}
                      >
                        {customer.status.charAt(0).toUpperCase() +
                          customer.status.slice(1)}
                      </span>
                    </Table.Cell>

                    <Table.Cell className="text-sm text-gray-500">
                      {customer.joinedDate}
                    </Table.Cell>

                    <Table.Cell className="text-right">
                      <Button
                        variant="outline"
                        isIconOnly
                        onClick={(e) => {
                          e.stopPropagation();
                          openCustomerModal(customer);
                        }}
                      >
                        <RiMoreFill size={20} />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>

        <div className="h-10"></div>
      </div>
    </div>
  );
}
