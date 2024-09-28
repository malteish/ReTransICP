import React, { useEffect, useState } from "react";
import { readContract } from "wagmi/actions"; // Updated import
import recurringTransactionsSmartContract from "../contracts/RecurringTransactions.json";
import { RECURRING_TRANSACTIONS_SMART_CONTRACT_ADDRESS } from "../utils/constants";
import { Config } from "wagmi";
interface RecurringTransaction {
  id: string;
  recipient: string;
  amount: string;
  period: string;
  executions: number;
  nextExecution: string;
}

interface RecurringTransactionsListProps {
  address: `0x${string}` | undefined;
  isConnected: boolean;
  config: Config;
}

const RecurringTransactionsList: React.FC<RecurringTransactionsListProps> = ({
  address,
  isConnected,
  config,
}) => {
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      fetchRecurringTransactions();
    }
  }, [isConnected, address]);

  const fetchRecurringTransactions = async () => {
    setLoading(true);
    setError(null);

    console.log("config", config);
    try {
      // Call the jobsForAddress function with address and index 0
      const jobNumber = await readContract(
        config,
        {
          address: RECURRING_TRANSACTIONS_SMART_CONTRACT_ADDRESS, // Ensure this constant is defined
          abi: recurringTransactionsSmartContract.abi, // ABI of the contract
          functionName: "jobsForAddress",
          args: [address, 0],
        }
        /** Add the required second argument, such as the chain ID */
        // Replace `1` with your target chain ID
      );

      console.log("Job Count:", jobNumber);

      //   // For demonstration, we'll just set a dummy transaction based on jobCount
      //   // You can modify this part based on your actual contract's response structure
      //   if (localJobCount > 0) {
      //     const dummyTransaction: RecurringTransaction = {
      //       id: "1",
      //       recipient: "0xRecipientAddress",
      //       amount: "1000",
      //       period: "Monthly",
      //       executions: localJobCount,
      //       nextExecution: "2024-05-01",
      //     };
      //     setTransactions([dummyTransaction]);
      //   } else {
      //     setTransactions([]);
      //   }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return <p>Please connect your wallet to view recurring transactions.</p>;
  }

  if (loading) {
    return <p>Loading recurring transactions...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  if (transactions.length === 0) {
    return <p>No recurring transactions found.</p>;
  }

  return (
    <div className="recurring-transactions-list">
      <h2>Recurring Transactions</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Recipient</th>
            <th>Amount</th>
            <th>Period</th>
            <th>Executions</th>
            <th>Next Execution</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td>{tx.id}</td>
              <td>{tx.recipient}</td>
              <td>{tx.amount}</td>
              <td>{tx.period}</td>
              <td>{tx.executions}</td>
              <td>{tx.nextExecution}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecurringTransactionsList;
