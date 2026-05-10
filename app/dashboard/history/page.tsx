"use client";

import {
  RiArrowDownSLine,
  RiArrowUpLine,
  RiSearchLine,
  RiFilter3Line,
  RiCalendarLine,
  RiMoreFill,
  RiBankLine,
} from "react-icons/ri";
import {
  Avatar,
  Button,
  Input,
  Table,
  Modal,
  ProgressCircle,
} from "@heroui/react";
import { useEffect, useState } from "react";
import { authService, User } from "@/app/lib/auth";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: string;
  description: string;
  customer?: string;
  accountNo: string;
  date: string;
  time: string;
  status: "completed" | "pending" | "failed";
  reference: string;
  balanceAfter?: string;
}

export default function HistoryPage() {
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  const fetchUser = async () => {
    try {
      const { isAuthenticated, user, business, summary } =
        await authService.checkAuth();

      if (isAuthenticated && user) {
        setUser(user);
        setBusiness(business);
        setSummary(summary);
        // console.log("Business fetched:", business);
        console.log("Summary fetched:", summary);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);
  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center mt-10 flex flex-col items-center">
          <ProgressCircle isIndeterminate aria-label="Loading...">
            <ProgressCircle.Track>
              <ProgressCircle.TrackCircle />
              <ProgressCircle.FillCircle />
            </ProgressCircle.Track>
          </ProgressCircle>
        </div>
      </div>
    );
  }

  const transactions: Transaction[] = [
    {
      id: "TXN-987654321",
      type: "credit",
      amount: "₦2,450,000",
      description: "Payment from Adebayo Chukwudi - Invoice #INV-3921",
      customer: "Adebayo Chukwudi",
      accountNo: "9987654321",
      date: "Apr 28, 2026",
      time: "14:32",
      status: "completed",
      reference: "REF-93847291",
      balanceAfter: "₦3,695,800",
    },
    {
      id: "TXN-987654320",
      type: "debit",
      amount: "₦892,450",
      description: "Transfer to Fatima Okonkwo - SUB-78491",
      customer: "Fatima Okonkwo",
      accountNo: "9987654320",
      date: "Apr 27, 2026",
      time: "09:15",
      status: "completed",
      reference: "REF-93847290",
      balanceAfter: "₦1,245,800",
    },
    {
      id: "TXN-987654319",
      type: "credit",
      amount: "₦1,500,000",
      description: "Customer deposit - Emmanuel Okafor",
      customer: "Emmanuel Okafor",
      accountNo: "9987654319",
      date: "Apr 26, 2026",
      time: "16:45",
      status: "completed",
      reference: "REF-93847289",
      balanceAfter: "₦2,138,250",
    },
    {
      id: "TXN-987654318",
      type: "debit",
      amount: "₦450,000",
      description: "Withdrawal - Aisha Bello",
      customer: "Aisha Bello",
      accountNo: "9987654318",
      date: "Apr 25, 2026",
      time: "11:20",
      status: "completed",
      reference: "REF-93847288",
      balanceAfter: "₦638,250",
    },
    {
      id: "TXN-987654317",
      type: "credit",
      amount: "₦3,210,000",
      description: "Bulk payment received",
      customer: "Aisha Bello",
      accountNo: "9987654318",
      date: "Apr 24, 2026",
      time: "08:05",
      status: "completed",
      reference: "REF-93847287",
      balanceAfter: "₦1,088,250",
    },
  ];

  const openTransactionModal = (txn: Transaction) => {
    setSelectedTransaction(txn);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full flex h-full flex-col items-center">
      <div className="max-w-310 flex flex-col gap-6 flex-1 w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-start items-start md:items-center md:justify-between mt-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Transaction History
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              All transactions across main and sub accounts
            </p>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full md:max-w-md">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search transactions, reference, or customer..."
              className="px-10 py-2 rounded-full bg-white outline-none w-full"
            />
          </div>
          <div className="flex self-end items-center gap-3">
            <Button variant="outline" className="flex items-center gap-2">
              <RiCalendarLine size={18} />
              Last 30 Days
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <RiFilter3Line size={18} />
              Filter
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <Table variant="secondary" aria-label="Transaction History">
          <Table.ScrollContainer>
            <Table.Content>
              <Table.Header>
                <Table.Column isRowHeader>TRANSACTION</Table.Column>
                <Table.Column>ACCOUNT</Table.Column>
                <Table.Column>AMOUNT</Table.Column>
                <Table.Column>DATE & TIME</Table.Column>
                <Table.Column>STATUS</Table.Column>
                <Table.Column className="text-right">ACTIONS</Table.Column>
              </Table.Header>
              <Table.Body>
                {transactions.map((txn) => (
                  <Table.Row
                    key={txn.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => openTransactionModal(txn)}
                  >
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-200`}
                        >
                          {txn.type === "credit" ? (
                            <RiArrowUpLine size={22} />
                          ) : (
                            <RiArrowDownSLine size={22} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-nowrap">
                            {txn.description}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {txn.reference}
                          </p>
                        </div>
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        {txn.customer && (
                          <span className="text-sm text-nowrap text-gray-600">
                            {txn.customer}
                          </span>
                        )}
                      </div>
                    </Table.Cell>

                    <Table.Cell>
                      <p
                        className={`font-medium text-nowrap text-sm ${
                          txn.type === "credit"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {txn.type === "credit" ? "+" : ""}
                        {txn.amount}
                      </p>
                    </Table.Cell>

                    <Table.Cell className="text-sm text-gray-500">
                      <div className="text-nowrap">{txn.date}</div>
                      <div className="text-xs">{txn.time}</div>
                    </Table.Cell>

                    <Table.Cell>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          txn.status === "completed"
                            ? "bg-green-50 text-green-600"
                            : txn.status === "pending"
                              ? "bg-yellow-50 text-yellow-600"
                              : "bg-red-50 text-red-600"
                        }`}
                      >
                        {txn.status.charAt(0).toUpperCase() +
                          txn.status.slice(1)}
                      </span>
                    </Table.Cell>

                    <Table.Cell className="text-right">
                      <Button
                        variant="outline"
                        isIconOnly
                        onClick={(e) => {
                          e.stopPropagation();
                          openTransactionModal(txn);
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
