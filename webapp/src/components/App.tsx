import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useConfiguration } from "../hooks/useConfiguration";
import { CreateRecurringTransaction } from "./CreateRecurringTransaction";
import { Info } from "./Info";
import { Welcome } from "./Welcome";
import RecurringTransactionsList from "./RecurringTransactionsList";
import { useConfig } from "wagmi";

const App = () => {
  const {
    address,
    isConnected,
    handleRecipientChange,
    handlePeriodChange,
    handleAmountChange,
    handleExecutionsChange,
    createConfigAndProfile,
    writeContractIsPending,
    writeContractIsError,
    writeContractError,
    recipientError,
    periodError: rpcError,
    amountError: urlError,
    ensInput,
    period,
    amount,
    executions,
    balanceData,
    balanceIsLoading,
    balanceIsError,
  } = useConfiguration();

  const config = useConfig();

  return (
    <div className="ds-container">
      <div className="main-container">
        <h1 className="ds-title">ReTransICP</h1>

        {/* Rainbowkit connect button */}
        <div className="connect-btn">
          <ConnectButton />
        </div>
      </div>

      <div className="steps-container">
        <Welcome
          address={address}
          balance={
            balanceData
              ? balanceData.formatted + " " + balanceData.symbol
              : "unknown in App.tsx"
          }
          balanceIsLoading={balanceIsLoading}
          balanceIsError={balanceIsError}
        />

        <CreateRecurringTransaction
          handleRecipientChange={handleRecipientChange}
          handleAmountChange={handleAmountChange}
          handlePeriodChange={handlePeriodChange}
          handleExecutionsChange={handleExecutionsChange}
          recipient={ensInput}
          amount={amount}
          period={period}
          executions={executions}
          recipientError={recipientError}
          amountError={rpcError}
          urlError={urlError}
          createRecurringTransaction={createConfigAndProfile}
          isConnected={isConnected}
          writeContractIsError={writeContractIsError}
          writeContractIsPending={writeContractIsPending}
          writeContractError={writeContractError}
        />

        <RecurringTransactionsList
          address={address}
          isConnected={isConnected}
          config={config}
        />
      </div>
      <Info />
    </div>
  );
};

export default App;
