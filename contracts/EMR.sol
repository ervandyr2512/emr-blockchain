// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EMR - Electronic Medical Record Smart Contract
 * @author Ervandy Rangganata (NIM: 0706012414015)
 * @notice Decentralized EMR system — blockchain stores ONLY metadata (hash).
 *         Full medical data is stored off-chain (simulated IPFS / cloud).
 * @dev Implements role-based access control via modifiers.
 *      All sensitive operations emit events for auditability.
 */
contract EMR {

    // ─────────────────────────────────────────────────────────────
    // DATA STRUCTURES
    // ─────────────────────────────────────────────────────────────

    /**
     * @dev Core record — only the SHA-256 hash of the medical data lives here.
     *      The full JSON blob is stored off-chain.
     */
    struct MedicalRecord {
        uint256  id;         // Auto-incremented record identifier
        address  patient;    // Wallet address of the record owner
        string   dataHash;   // SHA-256 hash of the off-chain JSON data
        uint256  timestamp;  // Block timestamp at creation / last update
        bool     active;     // Soft-delete flag (false = logically deleted)
    }

    // ─────────────────────────────────────────────────────────────
    // STATE VARIABLES
    // ─────────────────────────────────────────────────────────────

    /// @dev Master record store keyed by record ID
    mapping(uint256 => MedicalRecord) public records;

    /// @dev Tracks registered doctors (address => isDoctor)
    mapping(address => bool) public doctors;

    /**
     * @dev Two-level permission mapping:
     *      accessPermission[patient][doctor] = true  means doctor CAN read patient's records
     */
    mapping(address => mapping(address => bool)) public accessPermission;

    /// @dev Patient -> list of their record IDs (for getMyRecords)
    mapping(address => uint256[]) private patientRecordIds;

    /// @notice Total records ever created (used as next ID)
    uint256 public recordCount;

    // ─────────────────────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────────────────────

    event RecordCreated(
        uint256 indexed id,
        address indexed patient,
        string  dataHash,
        uint256 timestamp
    );

    event RecordUpdated(
        uint256 indexed id,
        address indexed updatedBy,
        string  newDataHash,
        uint256 timestamp
    );

    event RecordDeleted(
        uint256 indexed id,
        address indexed deletedBy,
        uint256 timestamp
    );

    event AccessGranted(
        address indexed patient,
        address indexed doctor,
        uint256 timestamp
    );

    event AccessRevoked(
        address indexed patient,
        address indexed doctor,
        uint256 timestamp
    );

    event DoctorRegistered(
        address indexed doctor,
        uint256 timestamp
    );

    event DoctorDeactivated(
        address indexed doctor,
        uint256 timestamp
    );

    // ─────────────────────────────────────────────────────────────
    // MODIFIERS
    // ─────────────────────────────────────────────────────────────

    /**
     * @dev Restricts function to the patient who owns the given record.
     * @param recordId  The record that must be owned by msg.sender
     */
    modifier onlyPatient(uint256 recordId) {
        require(
            records[recordId].patient == msg.sender,
            "EMR: caller is not the record owner"
        );
        require(
            records[recordId].active,
            "EMR: record is inactive"
        );
        _;
    }

    /**
     * @dev Restricts function to addresses registered as doctors.
     */
    modifier onlyDoctor() {
        require(
            doctors[msg.sender],
            "EMR: caller is not a registered doctor"
        );
        _;
    }

    // ─────────────────────────────────────────────────────────────
    // CREATE FUNCTIONS (4)
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Patient creates their own medical record.
     * @param dataHash  SHA-256 hash of the off-chain medical JSON
     */
    function createRecord(string calldata dataHash)
        external
        returns (uint256 newId)
    {
        require(bytes(dataHash).length > 0, "EMR: dataHash cannot be empty");

        newId = ++recordCount;

        records[newId] = MedicalRecord({
            id:        newId,
            patient:   msg.sender,
            dataHash:  dataHash,
            timestamp: block.timestamp,
            active:    true
        });

        patientRecordIds[msg.sender].push(newId);

        emit RecordCreated(newId, msg.sender, dataHash, block.timestamp);
    }

    /**
     * @notice Registered doctor creates a record ON BEHALF of a patient.
     * @dev Requires prior access grant from the patient.
     * @param patient   Patient wallet address
     * @param dataHash  SHA-256 hash of the off-chain medical JSON
     */
    function createRecordByDoctor(address patient, string calldata dataHash)
        external
        onlyDoctor
        returns (uint256 newId)
    {
        require(patient != address(0), "EMR: invalid patient address");
        require(bytes(dataHash).length > 0, "EMR: dataHash cannot be empty");
        require(
            accessPermission[patient][msg.sender],
            "EMR: doctor does not have access permission"
        );

        newId = ++recordCount;

        records[newId] = MedicalRecord({
            id:        newId,
            patient:   patient,
            dataHash:  dataHash,
            timestamp: block.timestamp,
            active:    true
        });

        patientRecordIds[patient].push(newId);

        emit RecordCreated(newId, patient, dataHash, block.timestamp);
    }

    /**
     * @notice Self-registration for a doctor address.
     * @dev In a production deployment this should be gated behind an admin role.
     *      For the academic prototype, any address may register once.
     */
    function registerDoctor(address doctorAddress) external {
        require(doctorAddress != address(0), "EMR: invalid address");
        require(!doctors[doctorAddress], "EMR: already registered as doctor");

        doctors[doctorAddress] = true;

        emit DoctorRegistered(doctorAddress, block.timestamp);
    }

    /**
     * @notice Patient grants a doctor access to ALL of their records.
     * @param doctor  Doctor wallet address
     */
    function grantAccess(address doctor) external {
        require(doctors[doctor], "EMR: address is not a registered doctor");
        require(
            !accessPermission[msg.sender][doctor],
            "EMR: access already granted"
        );

        accessPermission[msg.sender][doctor] = true;

        emit AccessGranted(msg.sender, doctor, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────
    // READ FUNCTIONS (4)
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Returns a single medical record.
     * @dev Only the patient themselves or a doctor with access may read.
     * @param recordId  ID of the record to retrieve
     */
    function getRecord(uint256 recordId)
        external
        view
        returns (MedicalRecord memory)
    {
        MedicalRecord memory rec = records[recordId];
        require(rec.active, "EMR: record is inactive or does not exist");

        bool isOwner   = rec.patient == msg.sender;
        bool isAllowed = doctors[msg.sender] && accessPermission[rec.patient][msg.sender];

        require(
            isOwner || isAllowed,
            "EMR: access denied"
        );

        return rec;
    }

    /**
     * @notice Checks whether a doctor currently has access to a patient's records.
     * @param patient  Patient wallet address
     * @param doctor   Doctor wallet address
     */
    function checkAccess(address patient, address doctor)
        external
        view
        returns (bool)
    {
        return accessPermission[patient][doctor];
    }

    /**
     * @notice Returns all ACTIVE record IDs that belong to msg.sender.
     */
    function getMyRecords()
        external
        view
        returns (uint256[] memory activeIds)
    {
        uint256[] storage allIds = patientRecordIds[msg.sender];
        uint256 count;

        // First pass — count active
        for (uint256 i = 0; i < allIds.length; i++) {
            if (records[allIds[i]].active) count++;
        }

        // Second pass — build return array
        activeIds = new uint256[](count);
        uint256 idx;
        for (uint256 i = 0; i < allIds.length; i++) {
            if (records[allIds[i]].active) {
                activeIds[idx++] = allIds[i];
            }
        }
    }

    /**
     * @notice Returns whether an address is a registered (active) doctor.
     * @param doctorAddress  Address to check
     */
    function checkDoctor(address doctorAddress)
        external
        view
        returns (bool)
    {
        return doctors[doctorAddress];
    }

    // ─────────────────────────────────────────────────────────────
    // UPDATE FUNCTIONS (3)
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Patient updates the data hash of their own record.
     * @param recordId    ID of the record to update
     * @param newDataHash SHA-256 hash of the new off-chain data
     */
    function updateRecord(uint256 recordId, string calldata newDataHash)
        external
        onlyPatient(recordId)
    {
        require(bytes(newDataHash).length > 0, "EMR: newDataHash cannot be empty");

        records[recordId].dataHash  = newDataHash;
        records[recordId].timestamp = block.timestamp;

        emit RecordUpdated(recordId, msg.sender, newDataHash, block.timestamp);
    }

    /**
     * @notice Authorised doctor updates the data hash of a patient's record.
     * @param recordId    ID of the record to update
     * @param newDataHash SHA-256 hash of the new off-chain data
     */
    function updateRecordByDoctor(uint256 recordId, string calldata newDataHash)
        external
        onlyDoctor
    {
        MedicalRecord storage rec = records[recordId];
        require(rec.active, "EMR: record is inactive");
        require(bytes(newDataHash).length > 0, "EMR: newDataHash cannot be empty");
        require(
            accessPermission[rec.patient][msg.sender],
            "EMR: doctor does not have access to this record"
        );

        rec.dataHash  = newDataHash;
        rec.timestamp = block.timestamp;

        emit RecordUpdated(recordId, msg.sender, newDataHash, block.timestamp);
    }

    /**
     * @notice Patient revokes a doctor's access to their records.
     * @param doctor  Doctor wallet address
     */
    function revokeAccess(address doctor) external {
        require(
            accessPermission[msg.sender][doctor],
            "EMR: no active access to revoke"
        );

        accessPermission[msg.sender][doctor] = false;

        emit AccessRevoked(msg.sender, doctor, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────
    // DELETE FUNCTIONS (2)
    // ─────────────────────────────────────────────────────────────

    /**
     * @notice Soft-deletes a record by setting active = false.
     * @dev The record data remains on-chain for audit trail; it is simply
     *      hidden from normal queries. Only the owning patient may delete.
     * @param recordId  ID of the record to deactivate
     */
    function deleteRecord(uint256 recordId)
        external
        onlyPatient(recordId)
    {
        records[recordId].active = false;

        emit RecordDeleted(recordId, msg.sender, block.timestamp);
    }

    /**
     * @notice Deactivates a doctor address (marks as non-doctor).
     * @dev In a real system this would be restricted to an admin.
     *      All existing access grants for this doctor remain in storage
     *      but become ineffective because checkDoctor returns false.
     * @param doctorAddress  Doctor wallet address to deactivate
     */
    function deactivateDoctor(address doctorAddress) external {
        require(doctors[doctorAddress], "EMR: address is not an active doctor");

        doctors[doctorAddress] = false;

        emit DoctorDeactivated(doctorAddress, block.timestamp);
    }
}
