// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Tokenizer42
 * @notice A capped, burnable, and pausable BEP-20/ERC-20 token for the 42 School project.
 * @dev The owner may mint up to the cap and pause or resume token transfers.
 */
contract Tokenizer42 is ERC20, ERC20Burnable, ERC20Capped, ERC20Pausable, Ownable {
    /// @notice The maximum number of TK42 tokens that can exist, with 18 decimals.
    uint256 public constant MAXIMUM_SUPPLY = 42_000_000 * 10 ** 18;

    /**
     * @notice Creates the token and mints the initial supply to the chosen owner.
     * @param initialOwner Address that receives ownership and the initial supply.
     * @param initialSupply Number of smallest token units to mint at deployment.
     */
    constructor(address initialOwner, uint256 initialSupply)
        ERC20("Tokenizer 42", "TK42")
        ERC20Capped(MAXIMUM_SUPPLY)
        Ownable(initialOwner)
    {
        _mint(initialOwner, initialSupply);
    }

    /**
     * @notice Creates tokens for a recipient without exceeding the maximum supply.
     * @param recipient Address that receives the new tokens.
     * @param amount Number of smallest token units to create.
     */
    function mint(address recipient, uint256 amount) external onlyOwner {
        _mint(recipient, amount);
    }

    /** @notice Stops transfers, approvals from spending, minting, and burning. */
    function pause() external onlyOwner {
        _pause();
    }

    /** @notice Resumes token operations after a pause. */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Applies the cap and pause checks to every balance change.
     * @param from Address sending tokens, or zero when minting.
     * @param to Address receiving tokens, or zero when burning.
     * @param amount Number of smallest token units moved, minted, or burned.
     */
    function _update(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Capped, ERC20Pausable)
    {
        super._update(from, to, amount);
    }
}
