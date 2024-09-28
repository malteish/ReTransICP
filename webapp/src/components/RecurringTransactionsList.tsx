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
      const jobs = [];
      let index = 0;
      while (true) {
        try {
          const jobNumber = await readContract(
            config,
            {
              address: RECURRING_TRANSACTIONS_SMART_CONTRACT_ADDRESS,
              abi: recurringTransactionsSmartContract.abi,
              functionName: "jobsForAddress",
              args: [address, index],
            }
            // Replace `1` with your target chain ID
          );

          jobs.push(jobNumber);
          index++;
        } catch (err: any) {
          console.log(
            "Reading job number reverted, assuming end of list:",
            err
          );
          break;
        }
      }

      console.log("Jobs:", jobs);

      // Process jobs array to set transactions
      // Example: setTransactions(jobs.map(job => ({ ... })));
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
