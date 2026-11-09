// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MultiSigWallet
 * @notice Holds native coin and executes calls after the required number of owners approve.
 * @dev The owner set and confirmation threshold are fixed at deployment.
 */
contract MultiSigWallet {
    /// @notice One proposed call that owners may approve and execute.
    struct Transaction {
        address destination;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmationCount;
    }

    /// @notice Emitted when the wallet receives native coin.
    event Deposit(address indexed sender, uint256 amount, uint256 newBalance);

    /// @notice Emitted when an owner proposes a transaction.
    event TransactionSubmitted(
        uint256 indexed transactionId,
        address indexed submitter,
        address indexed destination,
        uint256 value,
        bytes data
    );

    /// @notice Emitted when an owner confirms a proposed transaction.
    event TransactionConfirmed(uint256 indexed transactionId, address indexed owner);

    /// @notice Emitted when an owner removes their confirmation.
    event TransactionConfirmationRevoked(uint256 indexed transactionId, address indexed owner);

    /// @notice Emitted after a proposed transaction executes successfully.
    event TransactionExecuted(uint256 indexed transactionId, address indexed executor);

    /// @notice The wallet owners in their deployment order.
    address[] private owners;

    /// @notice True when an address is an owner of this wallet.
    mapping(address ownerAddress => bool ownerStatus) public isOwner;

    /// @notice The number of owner confirmations required to execute a transaction.
    uint256 public immutable requiredConfirmations;

    /// @dev Transactions are indexed by their position in this array.
    Transaction[] private transactions;

    /// @dev Records whether a given owner confirmed a given transaction.
    mapping(uint256 transactionId => mapping(address ownerAddress => bool confirmed)) private confirmations;

    /// @dev Reentrancy lock used only while a transaction is executing.
    uint256 private reentrancyStatus = 1;

    /// @notice The requested owner list contains no addresses.
    error NoOwnersProvided();

    /// @notice The required confirmation count is zero or exceeds the number of owners.
    error InvalidRequiredConfirmations(uint256 requested, uint256 ownerCount);

    /// @notice An owner address is the zero address.
    error ZeroAddressOwner();

    /// @notice An owner address occurs more than once in the requested owner list.
    error DuplicateOwner(address duplicateAddress);

    /// @notice The caller is not an owner of this wallet.
    error CallerIsNotOwner(address caller);

    /// @notice The requested transaction id does not exist.
    error TransactionDoesNotExist(uint256 transactionId);

    /// @notice The destination for a proposed transaction is the zero address.
    error ZeroAddressDestination();

    /// @notice This owner already confirmed the requested transaction.
    error AlreadyConfirmed(uint256 transactionId, address owner);

    /// @notice This owner has not confirmed the requested transaction.
    error NotConfirmed(uint256 transactionId, address owner);

    /// @notice The requested transaction has already executed.
    error AlreadyExecuted(uint256 transactionId);

    /// @notice Too few owners have confirmed the requested transaction.
    error InsufficientConfirmations(uint256 transactionId, uint256 actual, uint256 required);

    /// @notice The destination call failed; the transaction remains unexecuted.
    error TransactionCallFailed(uint256 transactionId, bytes returnData);

    /// @notice A transaction tried to re-enter executeTransaction.
    error ReentrantExecution();

    /**
     * @notice Creates a multisig wallet with a fixed list of owners and threshold.
     * @param initialOwners Addresses that may submit, confirm, revoke, and execute calls.
     * @param confirmationsRequired Number of distinct owner confirmations needed to execute.
     */
    constructor(address[] memory initialOwners, uint256 confirmationsRequired) {
        if (initialOwners.length == 0) {
            revert NoOwnersProvided();
        }
        if (confirmationsRequired == 0 || confirmationsRequired > initialOwners.length) {
            revert InvalidRequiredConfirmations(confirmationsRequired, initialOwners.length);
        }

        for (uint256 ownerIndex = 0; ownerIndex < initialOwners.length; ownerIndex += 1) {
            address ownerAddress = initialOwners[ownerIndex];
            if (ownerAddress == address(0)) {
                revert ZeroAddressOwner();
            }
            if (isOwner[ownerAddress]) {
                revert DuplicateOwner(ownerAddress);
            }

            owners.push(ownerAddress);
            isOwner[ownerAddress] = true;
        }

        requiredConfirmations = confirmationsRequired;
    }

    /**
     * @notice Accepts BNB or other native coin sent to the multisig.
     */
    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    /**
     * @notice Proposes a call and automatically records the submitter's confirmation.
     * @param destination Contract or account that will receive the call.
     * @param value Amount of native coin to send with the call.
     * @param data Encoded function call data, or empty bytes for a plain transfer.
     * @return transactionId The index assigned to the proposed transaction.
     */
    function submitTransaction(address destination, uint256 value, bytes calldata data)
        external
        onlyOwner
        returns (uint256 transactionId)
    {
        if (destination == address(0)) {
            revert ZeroAddressDestination();
        }

        transactionId = transactions.length;
        transactions.push(
            Transaction({
                destination: destination,
                value: value,
                data: data,
                executed: false,
                confirmationCount: 0
            })
        );

        emit TransactionSubmitted(transactionId, msg.sender, destination, value, data);
        _confirmTransaction(transactionId, msg.sender);
    }

    /**
     * @notice Adds the caller's confirmation to an unexecuted transaction.
     * @param transactionId Index of the proposed transaction.
     */
    function confirmTransaction(uint256 transactionId) external onlyOwner {
        _requireTransactionExists(transactionId);
        _confirmTransaction(transactionId, msg.sender);
    }

    /**
     * @notice Removes the caller's confirmation from an unexecuted transaction.
     * @param transactionId Index of the proposed transaction.
     */
    function revokeConfirmation(uint256 transactionId) external onlyOwner {
        _requireTransactionExists(transactionId);
        Transaction storage transaction = transactions[transactionId];
        if (transaction.executed) {
            revert AlreadyExecuted(transactionId);
        }
        if (!confirmations[transactionId][msg.sender]) {
            revert NotConfirmed(transactionId, msg.sender);
        }

        confirmations[transactionId][msg.sender] = false;
        transaction.confirmationCount -= 1;
        emit TransactionConfirmationRevoked(transactionId, msg.sender);
    }

    /**
     * @notice Executes a confirmed transaction once its threshold is met.
     * @dev Only owners may execute; state is marked before the external call.
     * @param transactionId Index of the proposed transaction.
     * @return returnData Data returned by the destination call.
     */
    function executeTransaction(uint256 transactionId)
        external
        nonReentrant
        onlyOwner
        returns (bytes memory returnData)
    {
        _requireTransactionExists(transactionId);
        Transaction storage transaction = transactions[transactionId];
        if (transaction.executed) {
            revert AlreadyExecuted(transactionId);
        }
        if (transaction.confirmationCount < requiredConfirmations) {
            revert InsufficientConfirmations(
                transactionId, transaction.confirmationCount, requiredConfirmations
            );
        }

        // Checks-effects-interactions: prevent re-entry or repeated execution before calling out.
        transaction.executed = true;
        (bool callSucceeded, bytes memory callReturnData) = transaction.destination.call{value: transaction.value}(
            transaction.data
        );
        if (!callSucceeded) {
            revert TransactionCallFailed(transactionId, callReturnData);
        }

        emit TransactionExecuted(transactionId, msg.sender);
        return callReturnData;
    }

    /**
     * @notice Returns every owner in the order supplied to the constructor.
     * @return ownerList The wallet's immutable owner list.
     */
    function getOwners() external view returns (address[] memory ownerList) {
        return owners;
    }

    /**
     * @notice Returns the number of proposed transactions.
     * @return transactionCount Number of entries in the wallet's transaction list.
     */
    function getTransactionCount() external view returns (uint256 transactionCount) {
        return transactions.length;
    }

    /**
     * @notice Returns the stored details of a proposed transaction.
     * @param transactionId Index of the proposed transaction.
     * @return destination Account or contract called by the transaction.
     * @return value Amount of native coin sent with the call.
     * @return data Encoded call data.
     * @return executed Whether the call completed successfully.
     * @return confirmationCount Number of active owner confirmations.
     */
    function getTransaction(uint256 transactionId)
        external
        view
        returns (
            address destination,
            uint256 value,
            bytes memory data,
            bool executed,
            uint256 confirmationCount
        )
    {
        _requireTransactionExists(transactionId);
        Transaction storage transaction = transactions[transactionId];
        return (
            transaction.destination,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.confirmationCount
        );
    }

    /**
     * @notice Reports whether an address confirmed a given transaction.
     * @param transactionId Index of the proposed transaction.
     * @param ownerAddress Address whose confirmation is being checked.
     * @return confirmed True if the address has an active confirmation.
     */
    function isConfirmed(uint256 transactionId, address ownerAddress) external view returns (bool confirmed) {
        _requireTransactionExists(transactionId);
        return confirmations[transactionId][ownerAddress];
    }

    /// @dev Restricts owner actions to addresses supplied in the constructor.
    modifier onlyOwner() {
        if (!isOwner[msg.sender]) {
            revert CallerIsNotOwner(msg.sender);
        }
        _;
    }

    /// @dev Prevents nested transaction execution during an external call.
    modifier nonReentrant() {
        if (reentrancyStatus != 1) {
            revert ReentrantExecution();
        }
        reentrancyStatus = 2;
        _;
        reentrancyStatus = 1;
    }

    /// @dev Marks an owner confirmation and increments the stored count.
    function _confirmTransaction(uint256 transactionId, address ownerAddress) private {
        Transaction storage transaction = transactions[transactionId];
        if (transaction.executed) {
            revert AlreadyExecuted(transactionId);
        }
        if (confirmations[transactionId][ownerAddress]) {
            revert AlreadyConfirmed(transactionId, ownerAddress);
        }

        confirmations[transactionId][ownerAddress] = true;
        transaction.confirmationCount += 1;
        emit TransactionConfirmed(transactionId, ownerAddress);
    }

    /// @dev Reverts if an id does not point to a stored transaction.
    function _requireTransactionExists(uint256 transactionId) private view {
        if (transactionId >= transactions.length) {
            revert TransactionDoesNotExist(transactionId);
        }
    }
}
