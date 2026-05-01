import { Table } from "@heroui/react";

export const TransactionTable = () => {
  const transactions = [
    {
      email: "kate@acme.com",
      amount: "₦100,000",
      status: "Completed",
      transactionId: "738scb38cvva",
    },
    {
      email: "john@acme.com",
      amount: "₦150,000",
      status: "Completed",
      transactionId: "928ndf49dkks",
    },
    {
      email: "sara@acme.com",
      amount: "₦200,000",
      status: "Failed",
      transactionId: "384kdj92klls",
    },
    {
      email: "michael@acme.com",
      amount: "₦250,000",
      status: "Pending",
      transactionId: "567lkm89pqr",
    },
  ];

  return (
    <Table variant="secondary">
      <Table.ScrollContainer>
        <Table.Content aria-label="Transactions">
          <Table.Header>
            <Table.Column isRowHeader>Email</Table.Column>
            <Table.Column>Amount</Table.Column>
            <Table.Column>Status</Table.Column>
            <Table.Column>Transaction ID</Table.Column>
          </Table.Header>
          <Table.Body>
            {transactions.map((tx) => (
              <Table.Row key={tx.transactionId}>
                <Table.Cell>{tx.email}</Table.Cell>
                <Table.Cell>{tx.amount}</Table.Cell>
                <Table.Cell
                  className={`${tx.status === "Completed" ? "text-green-600" : tx.status === "Pending" ? "text-warning" : "text-danger"} `}
                >
                  {tx.status}
                </Table.Cell>
                <Table.Cell>{tx.transactionId}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
};
