import { useBalance, useAccount } from "wagmi";

export function Welcome() {
  const { address } = useAccount();
  const {
    data: balanceData,
    isLoading: balanceIsLoading,
    isError: balanceIsError,
  } = useBalance({ address });

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
      </div>
    </>
  );
}
