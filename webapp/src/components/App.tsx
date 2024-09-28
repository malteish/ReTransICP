import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CreateRecurringTransaction } from "./CreateRecurringTransaction";
import { Info } from "./Info";
import { Welcome } from "./Welcome";
import RecurringTransactionsList from "./RecurringTransactionsList";
import { useAccount, useConfig } from "wagmi";

const App = () => {
  const { address, isConnected } = useAccount();
  const config = useConfig();

  return (
    <div className="ds-container">
      <div className="main-container">
        <h1 className="ds-title">ReTransICP</h1>

        <div className="connect-btn">
          <ConnectButton />
        </div>
      </div>

      <div className="steps-container">
        <Welcome />

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
