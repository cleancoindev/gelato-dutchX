module.exports = async function(callback)
{
    // Fetch Account & Contracts
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0]
    const GelatoCore = artifacts.require("GelatoCore");
    const GelatoDutchX = artifacts.require("GelatoDutchX");
    const SellToken = artifacts.require("EtherToken");
    const BuyToken = artifacts.require("TokenRDN");
    const gelatoDutchExchange = await GelatoDutchX.at("0x26386CFbEa64608a5Cab8dFcA11A9235Ed0e86dE")
    const sellToken = await SellToken.at("0xd0Dab4E640D95E9E8A47545598c33e31bDb53C7c")
    const buyToken = await BuyToken.at("0xc778417E063141139Fce010982780140Aa0cD5Ab")

    console.log(`
        Gelato DutchX: ${gelatoDutchExchange.address}
        Sell Token: ${sellToken.address}
        Buy Token: ${buyToken.address}
    `)

    // Big Numbers
    const BN = web3.utils.BN;


    // Get Minting Input parametets
    const blockNumber = await web3.eth.getBlockNumber();
    const block = await web3.eth.getBlock(blockNumber);
    const timestamp = block.timestamp;
    const executionTime = timestamp;

    const NUM_SUBORDERS_BN = new BN(2)
    const sellAmount = web3.utils.toWei("10", "ether")
    const INTERVAL_SPAN = 21600
    const gelatoPrepayment = new BN(await gelatoDutchExchange.contract.methods.calcGelatoPrepayment().call());
    const totalPrepayment = new BN(gelatoPrepayment).mul(NUM_SUBORDERS_BN);


    // Check sellToken ERC20 Allowance
    const allowance = await sellToken.contract.methods.allowance(account, gelatoDutchExchange.address).call()
    console.log(`Current Allowance of DutchX Interface: ${allowance}`)
    const sellTokenSellAmount = NUM_SUBORDERS_BN.mul(new BN(sellAmount))
    const enoughAllowance = new BN(allowance).gte(sellTokenSellAmount)
    if(!enoughAllowance )
    {
        console.log(`Current Allowance insufficient, creating an extra allowance of: ${sellTokenSellAmount.toString()}`)
        await sellToken.contract.methods.approve(gelatoDutchExchange.address, sellTokenSellAmount.toString())
        .send({from: account, gas: 200000})
        .once('transactionHash', txHash => {
            console.log(`Tx Hash: ${txHash}`)
        })
    }

    console.log(`
        Start Minting with the following parameters

        Sell Token: ${sellToken.address}
        Buy Token: ${buyToken.address}
        Num Claims: ${NUM_SUBORDERS_BN.toString()}
        Sell Amount: ${sellAmount}
        Execution Time: ${executionTime}
        Interval Span: ${INTERVAL_SPAN}
        Seller: ${account}
    `)

    console.log(`
    ⚡⚡⚡ Send TX ⚡⚡⚡
    `)

    await gelatoDutchExchange.contract.methods
      .mintTimedSellOrders(
        sellToken.address,
        buyToken.address,
        NUM_SUBORDERS_BN.toString(),
        sellAmount,
        executionTime,
        INTERVAL_SPAN
      )
    .send({
        value: totalPrepayment,
        gas: 2000000,
        from: account
    }) // gas needed to prevent out of gas error
    .once("transactionHash", hash => (console.log(`
        TX Hash: ${hash}
        EtherScan: https://rinkeby.etherscan.io/tx/${hash}
    `) ))
    .once("receipt", receipt => (console.log('Tx Receipt:', receipt)))
    .on("error", console.error);

    console.log(`
    ⚡⚡⚡ Tx Complete ⚡⚡⚡

    `)
}

