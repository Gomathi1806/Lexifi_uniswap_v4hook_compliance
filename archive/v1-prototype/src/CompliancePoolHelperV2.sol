// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IPoolManager} from "v4-core/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "v4-core/interfaces/callback/IUnlockCallback.sol";
import {PoolKey} from "v4-core/types/PoolKey.sol";
import {Currency} from "v4-core/types/Currency.sol";
import {BalanceDelta} from "v4-core/types/BalanceDelta.sol";
import {TickMath} from "v4-core/libraries/TickMath.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

/// @title CompliancePoolHelper V2
/// @notice Fixed: uses sync() before transfer for proper ERC20 settlement
contract CompliancePoolHelper is IUnlockCallback {
    IPoolManager public immutable poolManager;
    address public immutable owner;

    enum Action {
        ADD_LIQUIDITY,
        SWAP
    }

    struct CallbackData {
        Action action;
        address sender;
        PoolKey key;
        int24 tickLower;
        int24 tickUpper;
        int256 liquidityDelta;
        bool zeroForOne;
        int256 amountSpecified;
    }

    constructor(address _poolManager) {
        poolManager = IPoolManager(_poolManager);
        owner = msg.sender;
    }

    function addLiquidity(
        PoolKey calldata key,
        int24 tickLower,
        int24 tickUpper,
        int256 liquidityDelta
    ) external payable returns (BalanceDelta delta) {
        delta = abi.decode(
            poolManager.unlock(
                abi.encode(
                    CallbackData({
                        action: Action.ADD_LIQUIDITY,
                        sender: msg.sender,
                        key: key,
                        tickLower: tickLower,
                        tickUpper: tickUpper,
                        liquidityDelta: liquidityDelta,
                        zeroForOne: false,
                        amountSpecified: 0
                    })
                )
            ),
            (BalanceDelta)
        );
    }

    function swap(
        PoolKey calldata key,
        bool zeroForOne,
        int256 amountSpecified
    ) external payable returns (BalanceDelta delta) {
        delta = abi.decode(
            poolManager.unlock(
                abi.encode(
                    CallbackData({
                        action: Action.SWAP,
                        sender: msg.sender,
                        key: key,
                        tickLower: 0,
                        tickUpper: 0,
                        liquidityDelta: 0,
                        zeroForOne: zeroForOne,
                        amountSpecified: amountSpecified
                    })
                )
            ),
            (BalanceDelta)
        );
    }

    function unlockCallback(
        bytes calldata rawData
    ) external returns (bytes memory) {
        require(msg.sender == address(poolManager), "Not PoolManager");
        CallbackData memory data = abi.decode(rawData, (CallbackData));

        BalanceDelta delta;

        if (data.action == Action.ADD_LIQUIDITY) {
            (delta, ) = poolManager.modifyLiquidity(
                data.key,
                IPoolManager.ModifyLiquidityParams({
                    tickLower: data.tickLower,
                    tickUpper: data.tickUpper,
                    liquidityDelta: data.liquidityDelta,
                    salt: bytes32(0)
                }),
                new bytes(0)
            );
        } else {
            uint160 sqrtPriceLimitX96 = data.zeroForOne
                ? TickMath.MIN_SQRT_PRICE + 1
                : TickMath.MAX_SQRT_PRICE - 1;

            delta = poolManager.swap(
                data.key,
                IPoolManager.SwapParams({
                    zeroForOne: data.zeroForOne,
                    amountSpecified: data.amountSpecified,
                    sqrtPriceLimitX96: sqrtPriceLimitX96
                }),
                new bytes(0)
            );
        }

        // FIXED: Proper V4 settle pattern
        // sync() → transfer → settle() for ERC20 payments
        _settleDeltas(data.key.currency0, data.sender, delta.amount0());
        _settleDeltas(data.key.currency1, data.sender, delta.amount1());

        return abi.encode(delta);
    }

    function _settleDeltas(
        Currency currency,
        address sender,
        int128 amount
    ) internal {
        if (amount < 0) {
            // We owe the PoolManager this amount
            uint256 owed = uint256(uint128(-amount));
            address token = Currency.unwrap(currency);

            if (token == address(0)) {
                // Native ETH
                poolManager.settle{value: owed}();
            } else {
                // ERC20: must sync first so PM can track the incoming transfer
                poolManager.sync(currency);
                IERC20(token).transferFrom(sender, address(poolManager), owed);
                poolManager.settle();
            }
        } else if (amount > 0) {
            // PoolManager owes us — take tokens out to sender
            poolManager.take(currency, sender, uint256(uint128(amount)));
        }
    }

    function rescue(address token, address to) external {
        require(msg.sender == owner, "Not owner");
        if (token == address(0)) {
            payable(to).transfer(address(this).balance);
        } else {
            IERC20(token).transfer(to, IERC20(token).balanceOf(address(this)));
        }
    }

    receive() external payable {}
}
