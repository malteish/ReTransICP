import React, { useEffect, useState } from "react";
import { readContract, writeContract } from "wagmi/actions"; // Updated import
import recurringTransactionsSmartContract from "../contracts/RecurringTransactions.json";
import { RECURRING_TRANSACTIONS_SMART_CONTRACT_ADDRESS } from "../utils/constants";
import { Config } from "wagmi";

interface RecurringTransactionProps {
  id: number;
  amount: number;
  period: number;
  numberOfRemainingExecutions: number;
  lastExecution: number;
  sender: `0x${string}`;
  recipient: `0x${string}`;
  token: `0x${string}`;
  config: Config;
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
  config,
}) => {
  const handleStop = async () => {
    try {
      await writeContract(config, {
        address: RECURRING_TRANSACTIONS_SMART_CONTRACT_ADDRESS,
        abi: recurringTransactionsSmartContract.abi,
        functionName: "removeJob",
        args: [id],
      });
      alert(`Job ${id} stopped successfully.`);
    } catch (err) {
      console.error("Failed to stop job:", err);
      alert(`Failed to stop job ${id}.`);
    }
  };

  return (
    <tr>
      <td>{id.toString()}</td>
      <td>{recipient}</td>
      <td>{amount.toString()}</td>
      <td>{period.toString()}</td>
      <td>{numberOfRemainingExecutions.toString()}</td>
      <td>{lastExecution.toString()}</td>
      <td>
        <button
          onClick={handleStop}
          disabled={numberOfRemainingExecutions === 0}
        >
          Stop
        </button>
      </td>
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

    // todo: maybe use useReadContracts instead of readContract? https://github.com/wevm/wagmi/discussions/2278

    try {
      let index = 0;
      while (true) {
        try {
          const jobNumber = await readContract(config, {
            address: RECURRING_TRANSACTIONS_SMART_CONTRACT_ADDRESS,
            abi: recurringTransactionsSmartContract.abi,
            functionName: "jobsForAddress",
            args: [address, index],
          });

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

        // Define the expected type of transaction
        type Transaction = [
          number,
          number,
          number,
          number,
          `0x${string}`,
          `0x${string}`,
          `0x${string}`
        ];

        // Cast transaction to the defined type
        const typedTransaction = transaction as Transaction;

        setTransactions((prevTransactions) => [
          ...prevTransactions,
          {
            id: jobId as number,
            amount: typedTransaction[2] as number,
            period: typedTransaction[0] as number,
            numberOfRemainingExecutions: typedTransaction[1] as number,
            lastExecution: typedTransaction[3] as number,
            sender: typedTransaction[4] as `0x${string}`,
            recipient: typedTransaction[5] as `0x${string}`,
            token: typedTransaction[6] as `0x${string}`,
            config: config,
          },
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
            <th>Remaining Executions</th>
            <th>Last Execution</th>
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
              config={config}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecurringTransactionsList;
