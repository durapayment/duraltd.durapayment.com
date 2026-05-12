"use client";

import { useEffect, useState } from "react";
import { RiAddLine, RiMoreFill, RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { Avatar, Button, ProgressCircle, Table } from "@heroui/react";
import { authService, User } from "@/app/lib/auth";

export default function AccountsPage() {
  const [showBalance, setShowBalance] = useState(true);

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

  const subAccounts = [
    {
      id: "SUB-78492",
      customer: "Adebayo Chukwudi",
      accountNo: "9987654321",
      balance: "₦1,245,800",
      created: "Apr 12, 2026",
      status: "Active",
    },
    {
      id: "SUB-78491",
      customer: "Fatima Okonkwo",
      accountNo: "9987654320",
      balance: "₦892,450",
      created: "Apr 10, 2026",
      status: "Active",
    },
    {
      id: "SUB-78490",
      customer: "Emmanuel Okafor",
      accountNo: "9987654319",
      balance: "₦45,200",
      created: "Apr 08, 2026",
      status: "Active",
    },
    {
      id: "SUB-78489",
      customer: "Aisha Bello",
      accountNo: "9987654318",
      balance: "₦3,210,000",
      created: "Apr 05, 2026",
      status: "Active",
    },
  ];

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

  return (
    <div className="w-full flex h-full flex-col items-center">
      <div className="max-w-310 flex flex-col gap-6 flex-1 w-full">
        {/* Header */}
        <div className="flex gap-3 md:gap-0 flex-col md:flex-row items-start md:items-center justify-between mt-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Accounts</h1>
            <p className="text-gray-500 text-sm mt-1">
              Main corporate account and customer sub accounts
            </p>
          </div>

          <Button className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl">
            <RiAddLine size={20} />
            Generate New Sub Account
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 w-full max-w-120">
          <div className="bg-accent px-5 py-6 gap-2 flex flex-col rounded-lg shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-white/75">
                  Bank name
                </p>
                <p className="font-semibold text-white text-[18px]">
                  DuraPayment MFB
                </p>
              </div>
              <Button
                variant="ghost"
                className="p-2 text-white hover:bg-white/10"
                isIconOnly
                aria-label={showBalance ? "Hide balance" : "Show balance"}
                onClick={() => setShowBalance((prev) => !prev)}
              >
                {showBalance ? (
                  <RiEyeLine size={18} />
                ) : (
                  <RiEyeOffLine size={18} />
                )}
              </Button>
            </div>
            <p className="font-medium text-white text-[15px]">
              Account No. 8141314105
            </p>
            <p className="text-[30px] text-white font-semibold">
              {showBalance ? "₦3,450.00" : "****,***.**"}
            </p>
          </div>
        </div>

        {/* Sub Accounts Header + Search */}
        <div className="flex flex-col lg:flex-row gap-3 justify-start md:justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold">Customer Sub Accounts</h2>
            <p className="text-sm text-gray-500">
              Dynamic accounts generated for customers
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              placeholder="Search customer"
              aria-label="Search customer"
              className="px-4 py-2 border rounded-full"
            />
            <Button variant="outline" className="px-4">
              Filter
            </Button>
          </div>
        </div>

        {/* Sub Accounts Table */}
        <Table variant="secondary">
          <Table.ScrollContainer>
            <Table.Content aria-label="Customer Sub Accounts">
              <Table.Header>
                <Table.Column isRowHeader>CUSTOMER</Table.Column>
                <Table.Column>ACCOUNT NUMBER</Table.Column>
                <Table.Column>BALANCE</Table.Column>
                <Table.Column>CREATED</Table.Column>
                {/* <Table.Column>STATUS</Table.Column> */}
                <Table.Column className="text-right">ACTIONS</Table.Column>
              </Table.Header>
              <Table.Body>
                {subAccounts.map((account) => (
                  <Table.Row
                    key={account.id}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <Avatar.Fallback>
                            {account.customer
                              .split(" ")
                              .filter(Boolean)
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </Avatar.Fallback>
                        </Avatar>
                        <div className="flex flex-col text-nowrap leading-4">
                          <p className="font-medium">{account.customer}</p>
                          <p className="text-xs text-gray-500">{account.id}</p>
                        </div>
                      </div>
                    </Table.Cell>

                    <Table.Cell className="font-mono text-sm">
                      {account.accountNo}
                    </Table.Cell>

                    <Table.Cell>
                      <p className="font-semibold">{account.balance}</p>
                    </Table.Cell>

                    <Table.Cell className="text-sm text-nowrap text-gray-500">
                      {account.created}
                    </Table.Cell>

                    {/* <Table.Cell>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          account.status === "Active"
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-danger"
                        }`}
                      >
                        {account.status}
                      </span>
                    </Table.Cell> */}

                    <Table.Cell className="text-right">
                      <Button
                        variant="outline"
                        isIconOnly
                        aria-label={`More options for ${account.customer}`}
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
