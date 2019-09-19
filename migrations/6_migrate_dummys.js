const DummyAction = artifacts.require("DummyAction");
const DummyInterface = artifacts.require("DummyInterface");
const DummyTrigger = artifacts.require("DummyTrigger");
const GelatoCore = artifacts.require("GelatoCore");

module.exports = async (deployer, network, accounts) => {
    const _deployer = accounts[0];
    const gelatoCore = await GelatoCore.deployed();


    let one = await deployer.deploy(DummyInterface, gelatoCore.address, 100000, 0, {
        from: _deployer,
        overwrite: false
    });

    console.log("Dummy interface deployed")

    let two = await deployer.deploy(DummyAction,  {
        from: _deployer,
        overwrite: false
    });

    console.log("Dummy action deployed")


    let three = await deployer.deploy(DummyTrigger, {
        from: _deployer,
        overwrite: false
    });

    console.log("Dummy trigger deployed")


};
