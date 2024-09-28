import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CreateRecurringTransaction } from "./CreateRecurringTransaction";
import { Info } from "./Info";
import { Welcome } from "./Welcome";
import RecurringTransactionsList from "./RecurringTransactionsList";
import { useAccount, useConfig } from "wagmi";

const App = () => {
  const {
    address,
    isConnected,
    // balanceData,
    // balanceIsLoading,
    // balanceIsError,
  } = useAccount();
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
        {/* <Welcome
          address={address}
          balance={
            balanceData
              ? balanceData.formatted + " " + balanceData.symbol
              : "unknown in App.tsx"
          }
          balanceIsLoading={balanceIsLoading}
          balanceIsError={balanceIsError}
        /> */}

        <CreateRecurringTransaction />

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
