import { Avatar, Table } from "@heroui/react";

interface typesForTransaction {
  email: string;
  name: string;
  status: string;
  phone: string;
  dp: string;
}
export const CustomersTable = ({
  customers,
}: {
  customers: typesForTransaction[];
}) => {
  // const customers = [
  //   {
  //     name: "Kate Moore",
  //     phone: "+234 801 234 5678",
  //     email: "kate@acme.com",
  //     status: "Active",
  //     dp: "https://img.heroui.chat/image/avatar?w=400&h=400&u=7",
  //   },
  //   {
  //     name: "John Smith",
  //     phone: "+234 802 345 6789",
  //     email: "john@acme.com",
  //     status: "Active",
  //     dp: "https://img.heroui.chat/image/avatar?w=400&h=400&u=9",
  //   },
  //   {
  //     name: "Sara Johnson",
  //     phone: "+234 803 456 7890",
  //     email: "sara@acme.com",
  //     status: "Inactive",
  //     dp: "https://img.heroui.chat/image/avatar?w=400&h=400&u=10",
  //   },
  //   {
  //     name: "Michael Brown",
  //     phone: "+234 804 567 8901",
  //     email: "michael@acme.com",
  //     status: "Active",
  //     dp: "https://img.heroui.chat/image/avatar?w=400&h=400&u=11",
  //   },
  // ];

  return (
    <Table variant="secondary">
      <Table.ScrollContainer>
        <Table.Content aria-label="Customers">
          <Table.Header>
            <Table.Column isRowHeader>Name</Table.Column>
            <Table.Column className="">Contact</Table.Column>
            <Table.Column>Email</Table.Column>
            <Table.Column>Status</Table.Column>
          </Table.Header>
          <Table.Body>
            {customers.map((customer) => (
              <Table.Row key={customer.email} className="cursor-pointer">
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Avatar size="sm">
                      <Avatar.Image alt={customer.name} src={customer.dp} />
                      <Avatar.Fallback>
                        {customer.name
                          .split(" ")
                          .filter(Boolean)
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar>
                    <div className="flex flex-col text-nowrap leading-4">
                      {customer.name}
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell className={"text-nowrap"}>
                  {customer.phone}
                </Table.Cell>
                <Table.Cell>{customer.email}</Table.Cell>
                <Table.Cell
                  className={` ${customer.status === "Active" ? "text-green-600" : "text-danger"} `}
                >
                  {customer.status}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
};
