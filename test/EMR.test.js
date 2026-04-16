/**
 * EMR.test.js
 * -----------
 * Basic unit tests for the EMR smart contract.
 * Run: npx hardhat test
 */

const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("EMR Contract", function () {
  let emr, owner, patient, doctor, stranger;

  beforeEach(async function () {
    [owner, patient, doctor, stranger] = await ethers.getSigners();
    const EMR = await ethers.getContractFactory("EMR");
    emr = await EMR.deploy();
    await emr.waitForDeployment();
  });

  // ── Doctor registration ──────────────────────────────────────
  describe("registerDoctor", function () {
    it("registers a new doctor", async function () {
      await emr.registerDoctor(doctor.address);
      expect(await emr.checkDoctor(doctor.address)).to.equal(true);
    });

    it("reverts when registering twice", async function () {
      await emr.registerDoctor(doctor.address);
      await expect(emr.registerDoctor(doctor.address)).to.be.revertedWith(
        "EMR: already registered as doctor"
      );
    });
  });

  // ── Record creation ──────────────────────────────────────────
  describe("createRecord", function () {
    it("patient can create a record", async function () {
      const hash = "sha256_abc123";
      await expect(emr.connect(patient).createRecord(hash))
        .to.emit(emr, "RecordCreated")
        .withArgs(1, patient.address, hash, await latestTimestamp());

      const rec = await emr.connect(patient).getRecord(1);
      expect(rec.dataHash).to.equal(hash);
      expect(rec.active).to.equal(true);
    });

    it("doctor can create record for patient with access", async function () {
      await emr.registerDoctor(doctor.address);
      await emr.connect(patient).grantAccess(doctor.address);

      await expect(
        emr.connect(doctor).createRecordByDoctor(patient.address, "hash_xyz")
      ).to.emit(emr, "RecordCreated");
    });

    it("doctor cannot create record without access", async function () {
      await emr.registerDoctor(doctor.address);
      await expect(
        emr.connect(doctor).createRecordByDoctor(patient.address, "hash_xyz")
      ).to.be.revertedWith("EMR: doctor does not have access permission");
    });
  });

  // ── Access control ───────────────────────────────────────────
  describe("grantAccess / revokeAccess", function () {
    beforeEach(async function () {
      await emr.registerDoctor(doctor.address);
      await emr.connect(patient).createRecord("initial_hash");
    });

    it("patient grants access to doctor", async function () {
      await emr.connect(patient).grantAccess(doctor.address);
      expect(
        await emr.checkAccess(patient.address, doctor.address)
      ).to.equal(true);
    });

    it("doctor can read record after grant", async function () {
      await emr.connect(patient).grantAccess(doctor.address);
      const rec = await emr.connect(doctor).getRecord(1);
      expect(rec.id).to.equal(1);
    });

    it("patient revokes access", async function () {
      await emr.connect(patient).grantAccess(doctor.address);
      await emr.connect(patient).revokeAccess(doctor.address);
      expect(
        await emr.checkAccess(patient.address, doctor.address)
      ).to.equal(false);
    });

    it("stranger cannot read record", async function () {
      await expect(
        emr.connect(stranger).getRecord(1)
      ).to.be.revertedWith("EMR: access denied");
    });
  });

  // ── Update ───────────────────────────────────────────────────
  describe("updateRecord", function () {
    beforeEach(async function () {
      await emr.connect(patient).createRecord("old_hash");
      await emr.registerDoctor(doctor.address);
      await emr.connect(patient).grantAccess(doctor.address);
    });

    it("patient updates their own record", async function () {
      await emr.connect(patient).updateRecord(1, "new_hash");
      const rec = await emr.connect(patient).getRecord(1);
      expect(rec.dataHash).to.equal("new_hash");
    });

    it("doctor updates record with access", async function () {
      await emr.connect(doctor).updateRecordByDoctor(1, "doctor_hash");
      const rec = await emr.connect(patient).getRecord(1);
      expect(rec.dataHash).to.equal("doctor_hash");
    });
  });

  // ── Delete ───────────────────────────────────────────────────
  describe("deleteRecord (soft-delete)", function () {
    it("patient can soft-delete their record", async function () {
      await emr.connect(patient).createRecord("hash");
      await emr.connect(patient).deleteRecord(1);

      // getRecord should revert because active = false
      await expect(
        emr.connect(patient).getRecord(1)
      ).to.be.revertedWith("EMR: record is inactive or does not exist");
    });
  });

  // ── getMyRecords ─────────────────────────────────────────────
  describe("getMyRecords", function () {
    it("returns only active record IDs", async function () {
      await emr.connect(patient).createRecord("h1");
      await emr.connect(patient).createRecord("h2");
      await emr.connect(patient).createRecord("h3");
      await emr.connect(patient).deleteRecord(2); // soft-delete second

      const ids = await emr.connect(patient).getMyRecords();
      expect(ids.map(Number)).to.deep.equal([1, 3]);
    });
  });
});

// Helper — returns the latest block timestamp
async function latestTimestamp() {
  const block = await ethers.provider.getBlock("latest");
  return block.timestamp;
}
