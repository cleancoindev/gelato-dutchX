module.exports = async function(callback) {
  // Fetch Account & Contracts
  const accounts = await web3.eth.getAccounts();
  const account = accounts[0];
  const GelatoCore = artifacts.require("GelatoCore");
  const GelatoDutchX = artifacts.require("GelatoDutchX");
  const SellToken = artifacts.require("EtherToken");
  const BuyToken = artifacts.require("TokenRDN");
  const gelatoCore = await GelatoCore.at(
    "0x57A9cda1A88cbDa928f85e11Bf5E1E85fFDADe90"
  );
  const gelatoDutchExchange = await GelatoDutchX.at(
    "0x26386CFbEa64608a5Cab8dFcA11A9235Ed0e86dE"
  );
  const sellToken = await SellToken.at(
    "0xd0Dab4E640D95E9E8A47545598c33e31bDb53C7c"
  );
  const buyToken = await BuyToken.at(
    "0xc778417E063141139Fce010982780140Aa0cD5Ab"
  );

  // Fetch minted and not burned executionClaims
  const mintedClaims = {};
  const deploymentblockNum = 5105352;

  // Get past events
  await gelatoCore
    .getPastEvents(
      "LogNewExecutionClaimMinted",
      {
        fromBlock: deploymentblockNum,
        toBlock: "latest"
      },
      function(error, events) {}
    )
    .then(function(events) {
      events.forEach(event => {
        mintedClaims[parseInt(event.returnValues.executionClaimId)] = [
          event.returnValues.triggerAddress,
          event.returnValues.triggerPayload,
          event.returnValues.actionAddress,
          event.returnValues.actionPayload,
          event.returnValues.actionMaxGas,
          event.returnValues.dappInterface,
          event.returnValues.executionClaimId,
          event.returnValues.executionClaimHash,
          event.returnValues.executionClaimOwner
        ];
      });
    });

  // Check which execution claims already got executed and remove then from the list
  await gelatoCore
    .getPastEvents(
      "LogClaimExecutedBurnedAndDeleted",
      {
        fromBlock: deploymentblockNum,
        toBlock: "latest"
      },
      function(error, events) {}
    )
    .then(function(events) {
      if (events !== undefined) {
        events.forEach(event => {
          delete mintedClaims[parseInt(event.returnValues.executionClaimId)];
        });
      }
    });

  // Check which execution claims already got cancelled and remove then from the list
  await gelatoCore
    .getPastEvents(
      "LogExecutionClaimCancelled",
      {
        fromBlock: deploymentblockNum,
        toBlock: "latest"
      },
      function(error, events) {}
    )
    .then(function(events) {
      if (events !== undefined) {
        events.forEach(event => {
          delete mintedClaims[parseInt(event.returnValues.executionClaimId)];
        });
      }
    });

    console.log('Available ExecutionClaims: , mintedClaims', mintedClaims)

  // Loop through all execution claims and check if they are executable. If yes, execute, if not, skip
  let canExecuteReturn;

  for (var index in mintedClaims) {
    let claim = mintedClaims[index];
    console.log(`
      Check if ExeutionClaim: ${index} is executable
      `);
    // Call canExecute
    /*
      canExecute(address _triggerAddress,
        bytes memory _triggerPayload,
        address _actionAddress,
        bytes memory _actionPayload,
        uint256 _actionMaxGas,
        address _dappInterface,
        uint256 _executionClaimId)
      */
    canExecuteReturn = await gelatoCore.contract.methods
      .canExecute(
        claim[0],
        claim[1],
        claim[2],
        claim[3],
        claim[4],
        claim[5],
        claim[6]
      )
      .call();

    if (parseInt(canExecuteReturn[0].toString()) === 0) {
      console.log(`
        🔥🔥🔥ExeutionClaim: ${index} is executable🔥🔥🔥
        `);
      console.log(`
        ⚡⚡⚡ Send TX ⚡⚡⚡
        `);

      let txGasPrice = await web3.utils.toWei("5", "gwei");
        gelatoCore.contract.methods
        .execute(
          claim[0],
          claim[1],
          claim[2],
          claim[3],
          claim[4],
          claim[5],
          claim[6]
        )
        .send({
          gas: 3000000,
          from: account,
          gasPrice: txGasPrice
        }).once("receipt", receipt => (console.log('Tx Receipt:', receipt)))
        // .once("transactionHash", hash => (console.log(`
        // TX Hash:        ${hash}
        // EtherScan:      https://rinkeby.etherscan.io/tx/${hash}`)))
        // .once("receipt", receipt => (console.log('Tx Receipt:', receipt)))
        // .on("error", console.error);


        console.log(`
        ⚡⚡⚡ Tx Broadcasted ⚡⚡⚡
        `)

    } else {
      console.log(`
        ❌❌❌ExeutionClaim: ${index} is NOT executable❌❌❌`);
    }
  }

  console.log("___End of script___")
};
