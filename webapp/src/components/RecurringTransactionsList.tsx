import React, { useEffect, useState } from "react";
import { readContract } from "wagmi/actions"; // Updated import
import recurringTransactionsSmartContract from "../contracts/RecurringTransactions.json";
import { RECURRING_TRANSACTIONS_SMART_CONTRACT_ADDRESS } from "../utils/constants";
import { Config } from "wagmi";
import { ethers } from "ethers"; // Add this import

interface SmartContractTransaction {
  period: number;
  numberOfRemainingExecutions: number;
  amount: number;
  lastExecution: number;
  sender: `0x${string}`;
  recipient: `0x${string}`;
  token: `0x${string}`;
}

interface RecurringTransactionProps {
  id: number;
  amount: number;
  period: number;
  numberOfRemainingExecutions: number;
  lastExecution: number;
  sender: `0x${string}`;
  recipient: `0x${string}`;
  token: `0x${string}`;
}

const RecurringTransaction: React.FC<RecurringTransactionProps> = ({
  id,
  amount,
  period,
  numberOfRemainingExecutions,
  lastExecution,
  sender,
  recipient,
  token,
}) => {
  return (
    <tr>
      <td>{id}</td>
      <td>{recipient}</td>
      <td>{amount}</td>
      <td>{period}</td>
      <td>{numberOfRemainingExecutions}</td>
      <td>{lastExecution}</td>
    </tr>
  );
};

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
  const [transactions, setTransactions] = useState<RecurringTransactionProps[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      setTransactions([]);
      fetchRecurringTransactions();
    }
  }, [isConnected, address]);

  const fetchRecurringTransactions = async () => {
    setLoading(true);
    setError(null);
    const jobsIds = [];

    console.log("config", config);
    try {
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

          jobsIds.push(jobNumber);
          index++;
        } catch (err: any) {
          console.log(
            "Reading job number reverted, assuming end of list:",
            err
          );
          break;
        }
      }

      console.log("JobIdss:", jobsIds);

      // Process jobs array to set transactions
      for (const jobId of jobsIds) {
        const transaction = await readContract(config, {
          address: RECURRING_TRANSACTIONS_SMART_CONTRACT_ADDRESS,
          abi: recurringTransactionsSmartContract.abi,
          functionName: "jobs",
          args: [jobId],
        });

        console.log("Job ID:", jobId);
        console.log("Transaction Details:", transaction);

        setTransactions((prevTransactions) => [
          ...prevTransactions,
          transaction as RecurringTransactionProps,
        ]);
      }

      console.log("Loaded transactions for ", address, ":", transactions);
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
            <RecurringTransaction
              key={tx.id}
              id={tx.id}
              recipient={tx.recipient}
              amount={tx.amount}
              period={tx.period}
              numberOfRemainingExecutions={tx.numberOfRemainingExecutions}
              lastExecution={tx.lastExecution}
              sender={tx.sender}
              token={tx.token}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecurringTransactionsList;
