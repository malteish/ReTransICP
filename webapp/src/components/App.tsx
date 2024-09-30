import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CreateRecurringTransaction } from "./CreateRecurringTransaction";
import { Info } from "./Info";
import { AccountInfo } from "./AccountInfo";
import RecurringTransactionsList from "./RecurringTransactionsList";

const App = () => {
  return (
    <div className="ds-container">
      <div className="main-container">
        <h1 className="ds-title">ReTransICP</h1>

        <div className="connect-btn">
          <ConnectButton />
        </div>
      </div>

      <div className="steps-container">
        <CreateRecurringTransaction />
        <RecurringTransactionsList />
        <AccountInfo />
      </div>
      <Info />
    </div>
  );
};

export default App;
