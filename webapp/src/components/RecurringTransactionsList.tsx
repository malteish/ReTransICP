import React, { useEffect, useState } from "react";

interface RecurringTransaction {
  id: string;
  recipient: string;
  amount: string;
  period: string;
  executions: number;
  nextExecution: string;
}

interface RecurringTransactionsListProps {
  address: string;
  isConnected: boolean;
}

const RecurringTransactionsList: React.FC<RecurringTransactionsListProps> = ({
  address,
  isConnected,
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
    try {
      // Replace with your API endpoint or blockchain call
      const response = await fetch(
        `/api/recurring-transactions?address=${address}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch recurring transactions.");
      }
      const data: RecurringTransaction[] = await response.json();
      setTransactions(data);
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
