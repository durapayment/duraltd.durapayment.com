import { RiAddLine, RiMoreFill } from "react-icons/ri";
import { Avatar, Button, Table } from "@heroui/react";

export default function AccountsPage() {
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
                <Table.Column>STATUS</Table.Column>
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

                    <Table.Cell>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          account.status === "Active"
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-danger"
                        }`}
                      >
                        {account.status}
                      </span>
                    </Table.Cell>

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
