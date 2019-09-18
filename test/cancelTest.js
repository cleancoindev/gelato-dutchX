let {
  numberOfSubOrders,
    GelatoCore,
    GelatoDutchX,
    SellToken,
    BuyToken,
    DutchExchangeProxy,
    DutchExchange,
    timeTravel,
    BN,
    NUM_SUBORDERS_BN,
    GELATO_MAX_GAS_PRICE_BN,
    TOTAL_SELL_VOLUME,
    SUBORDER_SIZE_BN,
    INTERVAL_SPAN,
    GDX_MAXGAS_BN,
    GDX_PREPAID_FEE_BN,
    dutchExchangeProxy,
    dutchExchange,
    seller,
    accounts,
    sellToken,
    buyToken,
    gelatoDutchXContract,
    gelatoCore,
    gelatoCoreOwner,
    orderStateId,
    orderState,
    executionTime,
    interfaceOrderId,
    executionClaimIds,
    MSG_VALUE_BN,
    execShellCommand,
    DxGetter,
    execShellCommandLog,
    truffleAssert,
    userEthBalance,
    userSellTokenBalance,
    userBuyTokenBalance,
    executorEthBalance,
    dutchXMaxGasBN,
    execDepositAndSellTrigger,
    execDepositAndSellAction,
    execWithdrawTrigger,
    execWithdrawAction,
    depositAndSellMaxGas,
    withdrawMaxGas,
    CURRENT_GAS_PRICE,
    GELATO_RECOMMENDED_GAS_PRICE_BN
  } = require("./truffleTestConfig.js");


let returnedDataPayload;
let mintedClaims = {};
let encodedPayload;
let decodedPayload;
let txHash;
let txReceipt;
let revertExecutor;
let amountReceivedByExecutor;
let amountDeductedfromInterface;
let nextExecutionClaim;
let depositAndSellClaim;
let withdrawClaim;
let sellOrder;
let userSellTokenBalanceAfter;
let txGasPrice


describe("Cancel outstanding execution claims", () => {
    // ******** Deploy new instances Test ********
    before(async () => {
        gelatoDutchExchange = await GelatoDutchX.deployed();
        dutchExchangeProxy = await DutchExchangeProxy.deployed();
        dutchExchange = await DutchExchange.deployed();
        gelatoCore = await GelatoCore.deployed();
        sellToken = await SellToken.deployed();
        buyToken = await BuyToken.deployed();
        dxGetter = await DxGetter.deployed();
        accounts = await web3.eth.getAccounts();
        gelatoCoreOwner = await gelatoCore.contract.methods.owner().call();
        seller = accounts[2]; // account[2]
        revertExecutor = accounts[8]
        executor = accounts[9];
        txGasPrice = CURRENT_GAS_PRICE.toString()
    });

    it("Fetch Before Balance", async function() {
        // Fetch User Ether Balance
        userEthBalance = await web3.eth.getBalance(seller);
        // Fetch User SellToken Balance
        userSellTokenBalance = await sellToken.contract.methods
        .balanceOf(seller)
        .call();
        // Fetch User BuyToken Balance
        userBuyTokenBalance = new BN(await buyToken.contract.methods
        .balanceOf(seller)
        .call());
        // Fetch Executor Ether Balance
        executorEthBalance = await gelatoCore.contract.methods.executorBalances(executor).call();
    });

    it("Check that we can fetch all past created execution claims", async () => {
        await gelatoCore
          .getPastEvents(
            "LogNewExecutionClaimMinted",
            {
              fromBlock: 0,
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
            fromBlock: 0,
            toBlock: "latest"
          },
          function(error, events) {}
        )
        .then(function(events) {
          if (events !== undefined)
          {
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
            fromBlock: 0,
            toBlock: "latest"
          },
          function(error, events) {}
        )
        .then(function(events) {
          if (events !== undefined)
          {
            events.forEach(event => {
              delete mintedClaims[parseInt(event.returnValues.executionClaimId)];
            });
          }
        });
      });

      // Gets all past created execution claims, loops over them and stores the one which is executable in a hashtable
      it("Iterate over minted execution claims and fetch executable execution claim", async function() {
        this.timeout(70000);
        // Get all past created execution claims
        let executionClaimIdFetchSuccessful = false;
        let anyClaimExecutable = false;
        let canExecuteReturn;

        for (var index in mintedClaims) {
          let claim = mintedClaims[index];
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
            nextExecutionClaim = index;
            anyClaimExecutable = true;
            console.log(`ExecutionClaimId: ${nextExecutionClaim}
                         Should be a withdraw claim
            `);
            encodedPayload = claim[3];
          } else {
            anyClaimExecutable = false;
          }
        }

        // We fetched a deposit and sell claim, where the execution time is still in the future
        if (!anyClaimExecutable) {
          await timeTravel.advanceTimeAndBlock(parseInt(INTERVAL_SPAN));
          console.log(`Should only enter for deposit and sell claims`);
          for (let index in mintedClaims) {
            let claim = mintedClaims[index];

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
              nextExecutionClaim = index;
              console.log(`ExecutionClaimId: ${nextExecutionClaim}`);
              encodedPayload = claim[3];
              anyClaimExecutable = true;
            }
          }
        }

        assert.isTrue(anyClaimExecutable);
      });

      it("decode them parameters", async () => {
        // Get func selector

        let returnedFuncSelec = "";
        returnedDataPayload = "";
        for (let i = 0; i < encodedPayload.length; i++) {
          if (i < 10) {
            returnedFuncSelec = returnedFuncSelec.concat(encodedPayload[i]);
          } else {
            returnedDataPayload = returnedDataPayload.concat(encodedPayload[i]);
          }
        }
        console.log(`
            Returned Func:       ${returnedFuncSelec}
            DepositAndSell Func: ${web3.eth.abi.encodeFunctionSignature(
              execDepositAndSellAction
            )}
            Withdraw Func:       ${web3.eth.abi.encodeFunctionSignature(
              execWithdrawAction
            )}
        `);

        if (
          returnedFuncSelec ===
          web3.eth.abi.encodeFunctionSignature(execDepositAndSellAction)
        ) {
          isDepositAndSell = 0;
        } else if (
          returnedFuncSelec ===
          web3.eth.abi.encodeFunctionSignature(execWithdrawAction)
        ) {
          isDepositAndSell = 1;
        } else {
          isDepositAndSell = 2;
          console.log("FUNC SIG WRONG");
        }

        if (isDepositAndSell === 0) {
          decodedPayload = web3.eth.abi.decodeParameters(
            [
              {
                type: "uint256",
                name: "_executionClaimId"
              },
              {
                type: "address",
                name: "_sellToken"
              },
              {
                type: "address",
                name: "_buyToken"
              },
              {
                type: "uint256",
                name: "_amount"
              },
              {
                type: "uint256",
                name: "_executionTime"
              },
              {
                type: "uint256",
                name: "_prepaymentAmount"
              },
              {
                type: "uint256",
                name: "_orderStateId"
              }
            ],
            returnedDataPayload
          );

          orderState = await gelatoDutchExchange.contract.methods
            .orderStates(decodedPayload._orderStateId)
            .call();

          // console.log("Decoded Payload: decodedPayload ", decodedPayload);
        } else if (isDepositAndSell === 1) {
          decodedPayload = web3.eth.abi.decodeParameters(
            [
              {
                type: "uint256",
                name: "_executionClaimId"
              },
              {
                type: "address",
                name: "_sellToken"
              },
              {
                type: "address",
                name: "_buyToken"
              },
              {
                type: "uint256",
                name: "_amount"
              },
              {
                type: "uint256",
                name: "_lastAuctionIndex"
              }
            ],
            returnedDataPayload
          );

          orderState = false;
        }
        // console.log("Decoded Payload: decodedPayload ", decodedPayload);
      });


    it("Cancel Action from someone other than the seller should revert", async () => {
        // Cancel executionClaim
        let claim = mintedClaims[nextExecutionClaim];
        txReceipt = await truffleAssert.reverts(gelatoDutchExchange.contract.methods.cancelOrder(
            claim[0],
            claim[1],
            claim[2],
            claim[3],
            claim[4],
            claim[6])
        .send( {from: revertExecutor, gas: 300000} ));

    })

    it("Cancel Claim pair", async () => {
        let claim = mintedClaims[nextExecutionClaim];
        let amount = decodedPayload._amount;


        // Cancel executionClaim
        txReceipt = await gelatoDutchExchange.contract.methods.cancelOrder(
            claim[0],
            claim[1],
            claim[2],
            claim[3],
            claim[4],
            claim[6])
        .send( {from: seller, gas: 300000} );

        await gelatoDutchExchange.getPastEvents("LogOrderCancelled", (error, events) => {
            console.log(events)
        })

        // Fetch User SellToken Balance
        userSellTokenBalanceAfter = await sellToken.contract.methods
        .balanceOf(seller)
        .call();

        let userSellTokenBalanceAfterBN = new BN(userSellTokenBalanceAfter.toString())
        let amountsAreEqual = userSellTokenBalanceAfterBN.eq(SUBORDER_SIZE_BN)

        // CHECK: userSellTokenBalanceAfter must equal subOrderSizeBN
        assert.isTrue(amountsAreEqual, "Withdraw amount should equal SubOrderSize")



    });

    it("What happened in this test?", async function() {

        // Fetch User Ether Balance
        userEthBalanceAfter = await web3.eth.getBalance(seller);

        // Fetch User BuyToken Balance
        userBuyTokenBalanceAfter = await buyToken.contract.methods
        .balanceOf(seller)
        .call();
        // Fetch Executor Ether Balance
        executorEthBalanceAfter =  await gelatoCore.contract.methods.executorBalances(executor).call();


        console.log(`
        ***************************************************+

        SELLER BALANCE:
            ETH Balances Before:  ${userEthBalance / 10 ** 18} ETH
            ETH Balances After:   ${userEthBalanceAfter / 10 ** 18} ETH
            -----------
            Difference:           ${(userEthBalanceAfter - userEthBalance) /
              10 ** 18} ETH

            WETH Balance Before:  ${userSellTokenBalance / 10 ** 18} WETH
            WETH Balance After:   ${userSellTokenBalanceAfter / 10 ** 18} WETH
            -----------
            Difference:           ${(userSellTokenBalanceAfter -
              userSellTokenBalance) /
              10 ** 18} WETH

            ICE Balance Before:   ${userBuyTokenBalance / 10 ** 18} ICE
            ICE Balance After:    ${userBuyTokenBalanceAfter / 10 ** 18} ICE
            -----------
            Difference:           ${(userBuyTokenBalanceAfter -
              userBuyTokenBalance) /
              10 ** 18} ICE

        EXECUTOR BALANCE:
            ETH Balance Before:   ${executorEthBalance / 10 ** 18} ETH
            ETH Balance After:    ${executorEthBalanceAfter / 10 ** 18} ETH
            -----------
            Difference:           ${(executorEthBalanceAfter -
              executorEthBalance) /
              10 ** 18} ETH

        ***************************************************+

        `);

    assert.isTrue(true);
  });
});
