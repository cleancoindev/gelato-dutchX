pragma solidity ^0.5.10;

// Dummy Trigger for Gelato Protocol
// Aim: Checks if inputted timestamp is lower than now

contract DummyTrigger {

    function dummyFuncTrueNoParam()
        public
        view
        returns(bool)
    {
        return true;
    }

    function dummyFuncTrueOneParam(uint256 _num)
        public
        view
        returns(bool)
    {
        return true;
    }

    function dummyFuncTrueTenParam(uint256 _num, uint256 _num2, uint256 _num3, uint256 _num4, uint256 _num5, uint256 _num6, uint256 _num7, uint256 _num8, uint256 _num9, uint256 _num10)
        public
        view
        returns(bool)
    {
        return true;
    }

    function dummyFuncFalse()
        public
        view
        returns(bool)
    {
        false;
    }

}