pragma solidity ^0.5.10;
import '../base/IcedOut.sol';
// Dummy Trigger for Gelato Protocol
// Aim: Checks if inputted timestamp is lower than now

contract DummyInterface is IcedOut {


    constructor(address payable _gelatoCore, uint256 _maxGas, uint256 _interfaceGasPrice)
        IcedOut(_gelatoCore, _maxGas, _interfaceGasPrice)
        public
    {

    }

    function dummyFuncFalse(uint dummy)
        public
        view
        returns(bool)
    {
        false;
    }

    function mintDummy(address _triggerAddress, bytes calldata _triggerPayload, address _actionAddress, bytes calldata _actionPayload)
        external
        returns(bool)
    {
        mintExecutionClaim(_triggerAddress, _triggerPayload, _actionAddress, _actionPayload, 100000, msg.sender);
        return true;
    }
}