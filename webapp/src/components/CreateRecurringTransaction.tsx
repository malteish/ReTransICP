import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount, useWriteContract } from "wagmi";
import eureTokenABI from "../contracts/EurE_v1.2.2.json";
import recurringTransactionsSmartContract from "../contracts/RecurringTransactions.json";
import {
  EURE_SMART_CONTRACT_ADDRESS,
  RECURRING_TRANSACTIONS_SMART_CONTRACT_ADDRESS,
} from "../utils/constants";

export function CreateRecurringTransaction() {
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [period, setPeriod] = useState<string>("");
  const [executions, setExecutions] = useState<string>("");
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [periodError, setPeriodError] = useState<string | null>(null);
  const [executionsError, setExecutionsError] = useState<string | null>(null);
  const [showSuccessMsg, setShowSuccessMsg] = useState<boolean>(false);

  const { isConnected, address } = useAccount();

  const {
    writeContract,
    isPending: writeContractIsPending,
    isError: writeContractIsError,
    error: writeContractError,
    reset,
  } = useWriteContract();

  const handleRecipientChange = (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setRecipient(event.target.value);
    setRecipientError(null);
  };

  const handleAmountChange = (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setAmount(event.target.value);
    setAmountError(null);
  };

  const handlePeriodChange = (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setPeriod(event.target.value);
    setPeriodError(null);
  };

  const handleExecutionsChange = (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setExecutions(event.target.value);
    setExecutionsError(null);
  };

  const createRecurringTransaction = async () => {
    const periodBigInt = BigInt(period);
    const amountBigInt = BigInt(amount);
    const recipientAddress = recipient;

    if (!ethers.isAddress(recipient)) {
      setRecipientError("Invalid recipient address");
      console.log("Invalid recipient address");
      return;
    }

    const totalAmount = amountBigInt * BigInt(executions);

    writeContract({
      address: EURE_SMART_CONTRACT_ADDRESS,
      abi: eureTokenABI,
      functionName: "approve",
      args: [RECURRING_TRANSACTIONS_SMART_CONTRACT_ADDRESS, totalAmount],
    });

    writeContract({
      address: RECURRING_TRANSACTIONS_SMART_CONTRACT_ADDRESS,
      abi: recurringTransactionsSmartContract.abi,
      functionName: "createJob",
      args: [
        periodBigInt,
        executions,
        amountBigInt,
        recipientAddress,
        EURE_SMART_CONTRACT_ADDRESS,
      ],
      value: BigInt(1e16) * BigInt(executions),
    });
  };

  useEffect(() => {
    console.log("Account changed : ", address);
    setRecipient("");
    setPeriod("");
    setAmount("");
    setExecutions("");
    setRecipientError(null);
    setPeriodError(null);
    setAmountError(null);
    setExecutionsError(null);
    reset();
  }, [address]);

  const isDisabled = !isConnected || !recipient.length || !amount.length;

  return (
    <div className="description-text step">
      <h2 className="heading-text">Create a recurring transaction</h2>
      To create a recurring token transfer, please provide the details below.
      You will also have to grant an allowance to the smart contract so it can
      access your tokens. <br />
      What will happen: The smart contract will send the specified amount of
      tokens to the recipient address immediately. <br />
      After the specified period, the smart contract will send the same amount
      of tokens to the recipient address again. This will continue until the
      total number of executions is reached. <br />
      <div className="base-input-container">
        <div className="input-description">
          <span className="input-heading-hidden">Recipient</span>
          {recipientError && <span className="error">{recipientError}</span>}
        </div>
        <div className="input-container">
          <div className="input-heading">Recipient address:</div>
          <input
            className="input-field"
            value={recipient}
            onChange={handleRecipientChange}
          />
        </div>
        <div className="input-description">
          The address that will receive the tokens you send
        </div>
      </div>
      <div className="base-input-container">
        <div className="input-description">
          {amountError && <span className="error">{amountError}</span>}
        </div>
        <div className="input-container">
          <div className="input-heading">Amount:</div>
          <input
            className="input-field"
            value={amount}
            onChange={handleAmountChange}
          />
        </div>
        <div className="input-description">
          How many tokens should be sent, in token bits.
        </div>
      </div>
      <div className="base-input-container">
        <div className="input-description">
          {periodError && <span className="error">{periodError}</span>}
        </div>
        <div className="input-container">
          <div className="input-heading">Period:</div>
          <input
            className="input-field"
            value={period}
            onChange={handlePeriodChange}
          />
        </div>
        <div className="input-description">
          After which duration the tokens should be sent again (and again and
          again). In seconds.
        </div>
      </div>
      <div className="base-input-container">
        <div className="input-description">
          <span className="input-heading-hidden">Number of executions:</span>
          {executionsError && <span className="error">{executionsError}</span>}
        </div>
        <div className="input-container">
          <div className="input-heading">Number of executions:</div>
          <input
            className="input-field"
            value={executions}
            onChange={handleExecutionsChange}
          />
        </div>
        <div className="input-description">
          Total number of times the transaction should be executed.
        </div>
      </div>
      <div className="base-input-container">
        <div className="input-description">
          {showSuccessMsg && (
            <span className="success">
              Recurring transaction created successfully!
            </span>
          )}
        </div>
        <div>
          <button
            className={"btn env-btn active-btn ".concat(
              isDisabled ? "disabled-btn" : ""
            )}
            disabled={isDisabled}
            onClick={createRecurringTransaction}
          >
            Create recurring transaction
          </button>
        </div>
        <div className="input-description">
          A service fee of 0.01 xDai is charged for each execution. This payment
          will be part of the transactions you sign when you push the button.
        </div>
        <div>
          {writeContractIsError &&
            "Error when writing contract: " + writeContractError}
        </div>
      </div>
    </div>
  );
}
