import { useBalance, useAccount, useReadContract } from "wagmi";
import {
  EURE_SMART_CONTRACT_ADDRESS,
  RECURRING_TRANSACTIONS_SMART_CONTRACT_ADDRESS,
} from "../utils/constants";
import eureTokenABI from "../contracts/EurE_v1.2.2.json";

export function AccountInfo() {
  const { address } = useAccount();
  const {
    data: balanceData,
    isLoading: balanceIsLoading,
    isError: balanceIsError,
  } = useBalance({ address });

  const {
    data: allowanceData,
    isLoading: allowanceIsLoading,
    isError: allowanceIsError,
  } = useReadContract({
    address: EURE_SMART_CONTRACT_ADDRESS,
    abi: eureTokenABI,
    functionName: "allowance",
    args: [address, RECURRING_TRANSACTIONS_SMART_CONTRACT_ADDRESS],
  });

  return (
    <>
      <div className="description-text">
        You can use this web app to create, display or delete recurring ERC20
        token transfers from your address to another address. <br />
      </div>
      <div className="description-text">
        Your address is: <b>{address}</b>
        <br />
        Your balance is:{" "}
        <b>
          {balanceData
            ? balanceData.formatted + " " + balanceData.symbol
            : "unknown"}
        </b>
        {balanceIsLoading && <p>Loading balance...</p>}
        {balanceIsError && <p>Error loading balance</p>}
        <br />
        The recurring transactions smart contract is allowed to transfer this
        many of your EURe tokens:{" "}
        <b>
          {!allowanceIsLoading && !allowanceIsError
            ? (allowanceData as number).toString() // Assuming allowanceData is a number
            : "loading..."}
        </b>
      </div>
    </>
  );
}
