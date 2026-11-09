const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MultiSigWallet", function () {
  async function deployWallet() {
    const [ownerOne, ownerTwo, ownerThree, nonOwner, recipient] = await ethers.getSigners();
    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
    const wallet = await MultiSigWallet.deploy(
      [ownerOne.address, ownerTwo.address, ownerThree.address],
      2,
    );
    await wallet.waitForDeployment();
    return { wallet, ownerOne, ownerTwo, ownerThree, nonOwner, recipient };
  }

  describe("constructor", function () {
    it("accepts three unique owners and a 2-of-3 threshold", async function () {
      const { wallet, ownerOne, ownerTwo, ownerThree } = await deployWallet();
      expect(await wallet.getOwners()).to.deep.equal([ownerOne.address, ownerTwo.address, ownerThree.address]);
      expect(await wallet.requiredConfirmations()).to.equal(2n);
      expect(await wallet.isOwner(ownerOne.address)).to.equal(true);
      expect(await wallet.isOwner(ownerTwo.address)).to.equal(true);
      expect(await wallet.isOwner(ownerThree.address)).to.equal(true);
    });

    it("rejects an empty owner list", async function () {
      const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
      await expect(MultiSigWallet.deploy([], 1)).to.be.revertedWithCustomError(MultiSigWallet, "NoOwnersProvided");
    });

    it("rejects a zero threshold and a threshold above the owner count", async function () {
      const [ownerOne, ownerTwo] = await ethers.getSigners();
      const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");

      await expect(MultiSigWallet.deploy([ownerOne.address, ownerTwo.address], 0))
        .to.be.revertedWithCustomError(MultiSigWallet, "InvalidRequiredConfirmations")
        .withArgs(0, 2);
      await expect(MultiSigWallet.deploy([ownerOne.address, ownerTwo.address], 3))
        .to.be.revertedWithCustomError(MultiSigWallet, "InvalidRequiredConfirmations")
        .withArgs(3, 2);
    });

    it("rejects zero and duplicate owner addresses", async function () {
      const [ownerOne, ownerTwo] = await ethers.getSigners();
      const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");

      await expect(MultiSigWallet.deploy([ownerOne.address, ethers.ZeroAddress], 1))
        .to.be.revertedWithCustomError(MultiSigWallet, "ZeroAddressOwner");
      await expect(MultiSigWallet.deploy([ownerOne.address, ownerOne.address], 1))
        .to.be.revertedWithCustomError(MultiSigWallet, "DuplicateOwner")
        .withArgs(ownerOne.address);
      expect(ownerTwo.address).to.not.equal(ownerOne.address);
    });
  });

  describe("transaction lifecycle", function () {
    it("records a submission and counts the submitter's confirmation", async function () {
      const { wallet, ownerOne, recipient } = await deployWallet();
      const data = "0x";

      await expect(wallet.connect(ownerOne).submitTransaction(recipient.address, 0, data))
        .to.emit(wallet, "TransactionSubmitted")
        .withArgs(0, ownerOne.address, recipient.address, 0, data)
        .and.to.emit(wallet, "TransactionConfirmed")
        .withArgs(0, ownerOne.address);

      expect(await wallet.getTransactionCount()).to.equal(1n);
      expect(await wallet.isConfirmed(0, ownerOne.address)).to.equal(true);
      expect(await wallet.isConfirmed(0, recipient.address)).to.equal(false);
      const transaction = await wallet.getTransaction(0);
      expect(transaction.destination).to.equal(recipient.address);
      expect(transaction.value).to.equal(0n);
      expect(transaction.data).to.equal(data);
      expect(transaction.executed).to.equal(false);
      expect(transaction.confirmationCount).to.equal(1n);
    });

    it("rejects non-owners from submitting, confirming, revoking, or executing", async function () {
      const { wallet, ownerOne, recipient, nonOwner } = await deployWallet();
      await wallet.connect(ownerOne).submitTransaction(recipient.address, 0, "0x");

      await expect(wallet.connect(nonOwner).submitTransaction(recipient.address, 0, "0x"))
        .to.be.revertedWithCustomError(wallet, "CallerIsNotOwner")
        .withArgs(nonOwner.address);
      await expect(wallet.connect(nonOwner).confirmTransaction(0))
        .to.be.revertedWithCustomError(wallet, "CallerIsNotOwner");
      await expect(wallet.connect(nonOwner).revokeConfirmation(0))
        .to.be.revertedWithCustomError(wallet, "CallerIsNotOwner");
      await expect(wallet.connect(nonOwner).executeTransaction(0))
        .to.be.revertedWithCustomError(wallet, "CallerIsNotOwner");
    });

    it("rejects a zero destination and unknown transaction ids", async function () {
      const { wallet, ownerOne } = await deployWallet();
      await expect(wallet.connect(ownerOne).submitTransaction(ethers.ZeroAddress, 0, "0x"))
        .to.be.revertedWithCustomError(wallet, "ZeroAddressDestination");
      await expect(wallet.getTransaction(0)).to.be.revertedWithCustomError(wallet, "TransactionDoesNotExist");
      await expect(wallet.isConfirmed(0, ownerOne.address)).to.be.revertedWithCustomError(wallet, "TransactionDoesNotExist");
      await expect(wallet.connect(ownerOne).confirmTransaction(0)).to.be.revertedWithCustomError(wallet, "TransactionDoesNotExist");
      await expect(wallet.connect(ownerOne).revokeConfirmation(0)).to.be.revertedWithCustomError(wallet, "TransactionDoesNotExist");
      await expect(wallet.connect(ownerOne).executeTransaction(0)).to.be.revertedWithCustomError(wallet, "TransactionDoesNotExist");
    });

    it("rejects duplicate confirmations and confirmations after execution", async function () {
      const { wallet, ownerOne, ownerTwo, recipient } = await deployWallet();
      await wallet.connect(ownerOne).submitTransaction(recipient.address, 0, "0x");
      await expect(wallet.connect(ownerOne).confirmTransaction(0))
        .to.be.revertedWithCustomError(wallet, "AlreadyConfirmed")
        .withArgs(0, ownerOne.address);

      await wallet.connect(ownerTwo).confirmTransaction(0);
      await wallet.connect(ownerOne).executeTransaction(0);
      await expect(wallet.connect(ownerTwo).confirmTransaction(0))
        .to.be.revertedWithCustomError(wallet, "AlreadyExecuted")
        .withArgs(0);
      await expect(wallet.connect(ownerTwo).revokeConfirmation(0))
        .to.be.revertedWithCustomError(wallet, "AlreadyExecuted")
        .withArgs(0);
    });

    it("does not execute before the threshold and executes once it is met", async function () {
      const { wallet, ownerOne, ownerTwo, recipient } = await deployWallet();
      const transferValue = ethers.parseEther("0.25");
      await ownerOne.sendTransaction({ to: await wallet.getAddress(), value: ethers.parseEther("1") });
      const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);
      await wallet.connect(ownerOne).submitTransaction(recipient.address, transferValue, "0x");

      await expect(wallet.connect(ownerOne).executeTransaction(0))
        .to.be.revertedWithCustomError(wallet, "InsufficientConfirmations")
        .withArgs(0, 1, 2);
      await wallet.connect(ownerTwo).confirmTransaction(0);
      await expect(wallet.connect(ownerOne).executeTransaction(0))
        .to.emit(wallet, "TransactionExecuted")
        .withArgs(0, ownerOne.address);

      expect(await ethers.provider.getBalance(recipient.address)).to.equal(recipientBalanceBefore + transferValue);
      expect((await wallet.getTransaction(0)).executed).to.equal(true);
      await expect(wallet.connect(ownerTwo).executeTransaction(0))
        .to.be.revertedWithCustomError(wallet, "AlreadyExecuted")
        .withArgs(0);
    });

    it("allows an owner to revoke a confirmation before execution", async function () {
      const { wallet, ownerOne, ownerTwo, recipient } = await deployWallet();
      await wallet.connect(ownerOne).submitTransaction(recipient.address, 0, "0x");
      await wallet.connect(ownerTwo).confirmTransaction(0);

      await expect(wallet.connect(ownerTwo).revokeConfirmation(0))
        .to.emit(wallet, "TransactionConfirmationRevoked")
        .withArgs(0, ownerTwo.address);
      expect(await wallet.isConfirmed(0, ownerTwo.address)).to.equal(false);
      expect((await wallet.getTransaction(0)).confirmationCount).to.equal(1n);
      await expect(wallet.connect(ownerTwo).revokeConfirmation(0))
        .to.be.revertedWithCustomError(wallet, "NotConfirmed")
        .withArgs(0, ownerTwo.address);
      await expect(wallet.connect(ownerOne).revokeConfirmation(1))
        .to.be.revertedWithCustomError(wallet, "TransactionDoesNotExist");
    });

    it("accepts BNB and emits the deposit event", async function () {
      const { wallet, ownerOne } = await deployWallet();
      const depositValue = ethers.parseEther("0.5");

      await expect(ownerOne.sendTransaction({ to: await wallet.getAddress(), value: depositValue }))
        .to.emit(wallet, "Deposit")
        .withArgs(ownerOne.address, depositValue, depositValue);
      expect(await ethers.provider.getBalance(await wallet.getAddress())).to.equal(depositValue);
    });

    it("leaves a transaction unexecuted when its inner call fails", async function () {
      const { wallet, ownerOne, ownerTwo } = await deployWallet();
      await wallet.connect(ownerOne).submitTransaction(await wallet.getAddress(), 0, "0xdeadbeef");
      await wallet.connect(ownerTwo).confirmTransaction(0);

      await expect(wallet.connect(ownerOne).executeTransaction(0))
        .to.be.revertedWithCustomError(wallet, "TransactionCallFailed")
        .withArgs(0, "0x");
      const transaction = await wallet.getTransaction(0);
      expect(transaction.executed).to.equal(false);
      expect(transaction.confirmationCount).to.equal(2n);
    });

    it("blocks reentrant transaction execution", async function () {
      const { wallet, ownerOne, ownerTwo, recipient } = await deployWallet();
      const nestedExecution = wallet.interface.encodeFunctionData("executeTransaction", [1]);
      await wallet.connect(ownerOne).submitTransaction(await wallet.getAddress(), 0, nestedExecution);
      await wallet.connect(ownerOne).submitTransaction(recipient.address, 0, "0x");
      await wallet.connect(ownerTwo).confirmTransaction(0);
      await wallet.connect(ownerTwo).confirmTransaction(1);

      await expect(wallet.connect(ownerOne).executeTransaction(0))
        .to.be.revertedWithCustomError(wallet, "TransactionCallFailed");
      expect((await wallet.getTransaction(0)).executed).to.equal(false);
      expect((await wallet.getTransaction(1)).executed).to.equal(false);
    });
  });

  describe("Tokenizer42 ownership integration", function () {
    it("requires two multisig confirmations to mint and pause the token", async function () {
      const [ownerOne, ownerTwo, ownerThree, recipient] = await ethers.getSigners();
      const Tokenizer42 = await ethers.getContractFactory("Tokenizer42");
      const initialSupply = ethers.parseEther("4200000");
      const token = await Tokenizer42.deploy(ownerOne.address, initialSupply);
      await token.waitForDeployment();

      const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet");
      const multisig = await MultiSigWallet.deploy(
        [ownerOne.address, ownerTwo.address, ownerThree.address],
        2,
      );
      await multisig.waitForDeployment();
      const multisigAddress = await multisig.getAddress();
      await token.connect(ownerOne).transferOwnership(multisigAddress);
      expect(await token.owner()).to.equal(multisigAddress);

      const mintAmount = ethers.parseEther("3");
      await expect(token.connect(ownerOne).mint(recipient.address, mintAmount))
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
        .withArgs(ownerOne.address);

      const mintCall = token.interface.encodeFunctionData("mint", [recipient.address, mintAmount]);
      await multisig.connect(ownerOne).submitTransaction(await token.getAddress(), 0, mintCall);
      await expect(multisig.connect(ownerOne).executeTransaction(0))
        .to.be.revertedWithCustomError(multisig, "InsufficientConfirmations");
      await multisig.connect(ownerTwo).confirmTransaction(0);
      await multisig.connect(ownerOne).executeTransaction(0);
      expect(await token.balanceOf(recipient.address)).to.equal(mintAmount);
      expect(await token.totalSupply()).to.equal(initialSupply + mintAmount);

      const pauseCall = token.interface.encodeFunctionData("pause");
      await multisig.connect(ownerOne).submitTransaction(await token.getAddress(), 0, pauseCall);
      await multisig.connect(ownerTwo).confirmTransaction(1);
      await multisig.connect(ownerThree).executeTransaction(1);
      expect(await token.paused()).to.equal(true);
    });
  });
});
