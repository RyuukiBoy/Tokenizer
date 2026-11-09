const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Tokenizer42", function () {
  const initialSupply = ethers.parseEther("4200000");
  const maximumSupply = ethers.parseEther("42000000");

  async function deployToken() {
    const [owner, recipient, spender, nextOwner] = await ethers.getSigners();
    const Tokenizer42 = await ethers.getContractFactory("Tokenizer42");
    const token = await Tokenizer42.deploy(owner.address, initialSupply);
    await token.waitForDeployment();
    return { token, owner, recipient, spender, nextOwner };
  }

  it("sets the expected metadata, supply, cap, and owner", async function () {
    const { token, owner } = await deployToken();

    expect(await token.name()).to.equal("Tokenizer 42");
    expect(await token.symbol()).to.equal("TK42");
    expect(await token.decimals()).to.equal(18n);
    expect(await token.totalSupply()).to.equal(initialSupply);
    expect(await token.MAXIMUM_SUPPLY()).to.equal(maximumSupply);
    expect(await token.owner()).to.equal(owner.address);
    expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
  });

  it("supports transfers, approvals, and delegated transfers", async function () {
    const { token, owner, recipient, spender } = await deployToken();
    const transferAmount = ethers.parseEther("10");

    await expect(token.transfer(recipient.address, transferAmount))
      .to.emit(token, "Transfer")
      .withArgs(owner.address, recipient.address, transferAmount);
    await token.approve(spender.address, transferAmount);
    expect(await token.allowance(owner.address, spender.address)).to.equal(transferAmount);

    await expect(token.connect(spender).transferFrom(owner.address, recipient.address, transferAmount))
      .to.emit(token, "Transfer")
      .withArgs(owner.address, recipient.address, transferAmount);
    expect(await token.allowance(owner.address, spender.address)).to.equal(0n);
  });

  it("reverts when a transfer balance or delegated allowance is insufficient", async function () {
    const { token, owner, recipient, spender } = await deployToken();
    const tooMuch = initialSupply + 1n;

    await expect(token.transfer(recipient.address, tooMuch)).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    await token.approve(spender.address, 1n);
    await expect(token.connect(spender).transferFrom(owner.address, recipient.address, 2n))
      .to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
  });

  it("allows only the owner to mint and enforces the cap", async function () {
    const { token, owner, recipient, spender } = await deployToken();
    const mintAmount = ethers.parseEther("1");

    await expect(token.connect(spender).mint(recipient.address, mintAmount))
      .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
      .withArgs(spender.address);
    await expect(token.mint(recipient.address, mintAmount))
      .to.emit(token, "Transfer")
      .withArgs(ethers.ZeroAddress, recipient.address, mintAmount);
    await token.mint(recipient.address, maximumSupply - initialSupply - mintAmount);
    await expect(token.mint(owner.address, 1n)).to.be.revertedWithCustomError(token, "ERC20ExceededCap");
  });

  it("allows holders to burn and approved spenders to burnFrom", async function () {
    const { token, owner, recipient, spender } = await deployToken();
    const burnAmount = ethers.parseEther("2");

    await token.burn(burnAmount);
    expect(await token.totalSupply()).to.equal(initialSupply - burnAmount);
    await token.transfer(recipient.address, burnAmount);
    await token.connect(recipient).approve(spender.address, burnAmount);
    await token.connect(spender).burnFrom(recipient.address, burnAmount);
    expect(await token.totalSupply()).to.equal(initialSupply - 2n * burnAmount);
  });

  it("blocks token balance changes while paused and resumes after unpause", async function () {
    const { token, owner, recipient, spender } = await deployToken();
    const amount = ethers.parseEther("1");

    await expect(token.connect(spender).pause())
      .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
      .withArgs(spender.address);
    await expect(token.pause()).to.emit(token, "Paused").withArgs(owner.address);
    await expect(token.transfer(recipient.address, amount)).to.be.revertedWithCustomError(token, "EnforcedPause");
    await expect(token.mint(recipient.address, amount)).to.be.revertedWithCustomError(token, "EnforcedPause");
    await expect(token.burn(amount)).to.be.revertedWithCustomError(token, "EnforcedPause");
    await expect(token.unpause()).to.emit(token, "Unpaused").withArgs(owner.address);
    await token.transfer(recipient.address, amount);
    expect(await token.balanceOf(recipient.address)).to.equal(amount);
  });

  it("transfers ownership and blocks the former owner from privileged actions", async function () {
    const { token, owner, nextOwner } = await deployToken();
    await expect(token.transferOwnership(nextOwner.address))
      .to.emit(token, "OwnershipTransferred")
      .withArgs(owner.address, nextOwner.address);
    expect(await token.owner()).to.equal(nextOwner.address);
    await expect(token.pause())
      .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
      .withArgs(owner.address);
  });

  it("makes privileged functions unavailable after ownership is renounced", async function () {
    const { token, owner, recipient } = await deployToken();
    await expect(token.renounceOwnership())
      .to.emit(token, "OwnershipTransferred")
      .withArgs(owner.address, ethers.ZeroAddress);
    expect(await token.owner()).to.equal(ethers.ZeroAddress);
    await expect(token.mint(recipient.address, 1n))
      .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
      .withArgs(owner.address);
    await expect(token.pause())
      .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
      .withArgs(owner.address);
  });
});
