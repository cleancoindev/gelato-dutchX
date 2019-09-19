const DummyAction = artifacts.require("DummyAction");
const DummyInterface = artifacts.require("DummyInterface");
const DummyTrigger = artifacts.require("DummyTrigger");
const GelatoCore = artifacts.require("GelatoCore");

let dummyTrigger;
let dummyAction;
let dummyInterface;
let accounts;
let gelatoCoreOwner;
let seller;
let revertExecutor;
let executor;
let triggerPayload;
let triggerPayload2;
let triggerPayload3;
let actionPayload;
let actionPayload2;
let actionPayload3;
let maxGas;
let numMints;
let gasPrice;
let counter;

describe("Successfully execute first execution claim", () => {
  before(async () => {
    dummyAction = await DummyAction.deployed();
    dummyInterface = await DummyInterface.deployed();
    dummyTrigger = await DummyTrigger.deployed();
    console.log(dummyInterface.address);
    gelatoCore = await GelatoCore.deployed();
    accounts = await web3.eth.getAccounts();
    gelatoCoreOwner = accounts[0];
    seller = accounts[2];
    revertExecutor = accounts[8];
    executor = accounts[9];
    maxGas = 100000;
    gasPrice = web3.utils.toWei("2", "gwei");
    counter=1;


  });

  it("Set payloads", async () => {
    let triggerFunc = "dummyFuncTrueNoParam()";
    let actionFunc = "dummyActionNoParams()";
    triggerPayload = web3.eth.abi.encodeFunctionCall(
      {
        name: triggerFunc,
        type: "function",
        inputs: []
      },
      []
    );

    actionPayload = web3.eth.abi.encodeFunctionCall(
      {
        name: actionFunc,
        type: "function",
        inputs: []
      },
      []
    );
    // #####################################

    let triggerFunc2 = "dummyFuncTrueOneParam(uint256)";
    let actionFunc2 = "dummyActionNoParams()";

    triggerPayload2 = web3.eth.abi.encodeFunctionCall(
      {
        name: triggerFunc2,
        type: "function",
        inputs: [{
          type: "uint256",
          name: "num"
        }]
      },
      [10]
    );

    actionPayload2 = web3.eth.abi.encodeFunctionCall(
      {
        name: actionFunc2,
        type: "function",
        inputs: []
      },
      []
    );

    // #####################################

    let triggerFunc3 = "dummyFuncTrueTenParam(uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256)";
    let actionFunc3 = "dummyActionNoParams()";

    triggerPayload3 = web3.eth.abi.encodeFunctionCall(
      {
        name: triggerFunc3,
        type: "function",
        inputs: [{
          type: "uint256",
          name: "num"
        },{
          type: "uint256",
          name: "num2"
        },{
          type: "uint256",
          name: "num3"
        },{
          type: "uint256",
          name: "num4"
        },{
          type: "uint256",
          name: "num5"
        },{
          type: "uint256",
          name: "num6"
        },{
          type: "uint256",
          name: "num7"
        },{
          type: "uint256",
          name: "num8"
        },{
          type: "uint256",
          name: "num9"
        },{
          type: "uint256",
          name: "num10"
        }]
      },
      [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
    );

    actionPayload3 = web3.eth.abi.encodeFunctionCall(
      {
        name: actionFunc3,
        type: "function",
        inputs: []
      },
      []
    );

  });

  it("Adding 1ETH as balance from gelatoDutchExchange to gelatoCore should work", async () => {
    let messageValue = web3.utils.toWei("4", "ether");
    // Get gelatoDutchExchange's balance on core before adding a new balance

    let fetchedGelatoCore = await dummyInterface.contract.methods
      .gelatoCore()
      .call();
    console.log(`${fetchedGelatoCore} == ${gelatoCore.address}`);

    // Let gelatoDutchExchange increase its balance by 1 ETH
    await dummyInterface.contract.methods
      .addBalanceToGelato()
      .send({
        from: gelatoCoreOwner,
        value: messageValue,
        gas: 5000000,
        gasPrice: gasPrice
      })
      .once("transactionHash", hash => (txHash = hash))
      .once("receipt", receipt => console.log("Balance succesfully added"))
      .on("error", console.error);

    // Check if that balance is actually added
    let interFaceBalancec = await gelatoCore.contract.methods
      .interfaceBalances(dummyInterface.address)
      .call();

    console.log(`Interfacebalance: ${interFaceBalancec}`);
  });

  it("mint the dummy execution claims", async () => {
    numMints = 10;
    console.log(`Mint ${numMints} execution claims`);
    for (let j = 1; j <= numMints; j++) {
      console.log(`Num: ${j}`);
      await dummyInterface.contract.methods
        .mintDummy(
          dummyTrigger.address,
          triggerPayload,
          dummyAction.address,
          actionPayload
        )
        .send({ from: gelatoCoreOwner, gas: 1000000, gasPrice: gasPrice })
        .once("receipt", receipt => console.log("Claim succesfully minted"));
    }
  });

  it("mint the dummy execution claims 2", async () => {
    console.log(`Mint ${numMints} execution claims`);
    for (let j = 1 + numMints; j <= numMints + numMints; j++) {
      console.log(`Num: ${j}`);
      await dummyInterface.contract.methods
        .mintDummy(
          dummyTrigger.address,
          triggerPayload2,
          dummyAction.address,
          actionPayload2
        )
        .send({ from: gelatoCoreOwner, gas: 1000000, gasPrice: gasPrice })
        .once("receipt", receipt => console.log("Claim succesfully minted"));
    }
  });

  it("mint the dummy execution claims 3", async () => {
    console.log(`Mint ${numMints} execution claims`);
    for (let j = 1 + numMints*2; j <= numMints + numMints*2; j++) {
      console.log(`Num: ${j}`);
      await dummyInterface.contract.methods
        .mintDummy(
          dummyTrigger.address,
          triggerPayload3,
          dummyAction.address,
          actionPayload3
        )
        .send({ from: gelatoCoreOwner, gas: 1000000, gasPrice: gasPrice })
        .once("receipt", receipt => console.log("Claim succesfully minted"));
    }
  });


  it("check minted execution Claims", async () => {
    let currentId = await gelatoCore.contract.methods
      .getCurrentExecutionClaimId()
      .call();
    console.log(`Current ID: ${currentId}`);
    const mintedClaims = {};
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
          console.log(event.returnValues.executionClaimId);
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
    console.log("events logged");
  });

  it("1 Execute execution Claims and print out gas usage", async () => {
    for (let j = 1; j <= numMints; j++) {
      console.log(`Execute Claim Num: ${j}`);
      let returnValue = await gelatoCore.contract.methods
        .canExecute(
          dummyTrigger.address,
          triggerPayload,
          dummyAction.address,
          actionPayload,
          maxGas,
          dummyInterface.address,
          j
        )
        .call();

      console.log("returnValue: ", returnValue[0]);

      let txReciept = await gelatoCore.contract.methods
        .execute(
          dummyTrigger.address,
          triggerPayload,
          dummyAction.address,
          actionPayload,
          maxGas,
          dummyInterface.address,
          j
        )
        .send({ from: gelatoCoreOwner, gas: 500000, gasPrice: gasPrice })
        .once("receipt", receipt => console.log("CLaim succesfully executed"));
      console.log(`Gas used: ${txReciept.gasUsed}`);
      let num0;
      let num1;
      let num2;


      let zero;
      let one
      let two;


      // CHECK IF Execution failed or not
      await gelatoCore.getPastEvents(
        "LogGasConsumption",
        (error, events) => {
          zero = events[0].returnValues.gasConsumed
          num0 = events[0].returnValues.num
          one = events[1].returnValues.gasConsumed
          num1 = events[1].returnValues.num
          two = events[2].returnValues.gasConsumed
          num2 = events[2].returnValues.num
      })
        console.log(`Before first gasleft => ${500000 - zero}`)
        console.log(`After second gasleft => ${one - two}`)
      }



  });

  it(" 2 Execute execution Claims and print out gas usage", async () => {
    console.log("Second Round")
    for (let j = 1 + numMints; j <= numMints + numMints; j++) {
      console.log(`Execute Claim Num: ${j}`);
      let returnValue = await gelatoCore.contract.methods
        .canExecute(
          dummyTrigger.address,
          triggerPayload2,
          dummyAction.address,
          actionPayload2,
          maxGas,
          dummyInterface.address,
          j
        )
        .call();

      console.log("returnValue: ", returnValue[0]);

      let txReciept = await gelatoCore.contract.methods
        .execute(
          dummyTrigger.address,
          triggerPayload2,
          dummyAction.address,
          actionPayload2,
          maxGas,
          dummyInterface.address,
          j
        )
        .send({ from: gelatoCoreOwner, gas: 500000, gasPrice: gasPrice })
        .once("receipt", receipt => console.log("CLaim succesfully executed"));
      console.log(`Gas used: ${txReciept.gasUsed}`);
        let num0;
        let num1;
        let num2;


        let zero;
        let one
        let two;


        // CHECK IF Execution failed or not
        await gelatoCore.getPastEvents(
          "LogGasConsumption",
          (error, events) => {
            zero = events[0].returnValues.gasConsumed
            num0 = events[0].returnValues.num
            one = events[1].returnValues.gasConsumed
            num1 = events[1].returnValues.num
            two = events[2].returnValues.gasConsumed
            num2 = events[2].returnValues.num
        })
        console.log(`Before first gasleft => ${500000 - zero}`)
        console.log(`After second gasleft => ${one - two}`)
        }
  })

  it(" 3 Execute execution Claims and print out gas usage", async () => {
    console.log("Third Round")
    for (let j = 1 + numMints*2; j <= numMints + numMints*2; j++) {
      console.log(`Execute Claim Num: ${j}`);
      let returnValue = await gelatoCore.contract.methods
        .canExecute(
          dummyTrigger.address,
          triggerPayload3,
          dummyAction.address,
          actionPayload3,
          maxGas,
          dummyInterface.address,
          j
        )
        .call();

      console.log("returnValue: ", returnValue[0]);

      let txReciept = await gelatoCore.contract.methods
        .execute(
          dummyTrigger.address,
          triggerPayload3,
          dummyAction.address,
          actionPayload3,
          maxGas,
          dummyInterface.address,
          j
        )
        .send({ from: gelatoCoreOwner, gas: 500000, gasPrice: gasPrice })
        .once("receipt", receipt => console.log("CLaim succesfully executed"));
      console.log(`Gas used: ${txReciept.gasUsed}`);

      let num0;
      let num1;
      let num2;


      let zero;
      let one
      let two;


      // CHECK IF Execution failed or not
      await gelatoCore.getPastEvents(
        "LogGasConsumption",
        (error, events) => {
          zero = events[0].returnValues.gasConsumed
          num0 = events[0].returnValues.num
          one = events[1].returnValues.gasConsumed
          num1 = events[1].returnValues.num
          two = events[2].returnValues.gasConsumed
          num2 = events[2].returnValues.num
      })
      console.log(`Before first gasleft => ${500000 - zero}`)
      console.log(`After second gasleft => ${one - two}`)
      }
  })


  it("check that minted claims got delted and burned", async () => {
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
        if (events !== undefined) {
          events.forEach(event => {
            console.log(`Deleted: ${event.returnValues.executionClaimId}`);
          });
        }
      });
    console.log("delted events logged");
  });

});
