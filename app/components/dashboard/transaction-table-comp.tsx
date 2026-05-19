import { Table } from "@heroui/react";

interface typesForTransaction {
  email: string;
  amount: string;
  status: string;
  transactionId: string;
}

export const TransactionTable = ({
  transactions,
}: {
  transactions: typesForTransaction[];
}) => {
  return (
    <Table variant="secondary">
      <Table.ScrollContainer>
        <Table.Content aria-label="Transactions">
          <Table.Header>
            <Table.Column isRowHeader>Details</Table.Column>
            <Table.Column>Amount</Table.Column>
            <Table.Column>Status</Table.Column>
            <Table.Column>Transaction ID</Table.Column>
          </Table.Header>
          <Table.Body>
            {transactions.map((tx: any) => (
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
