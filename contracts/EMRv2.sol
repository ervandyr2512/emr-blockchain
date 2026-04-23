// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title  EMRv2 — Multi-Role Electronic Medical Record
 * @author Ervandy Rangganata
 * @notice Stores SHA-256 hashes of medical data on-chain.
 *         Full medical JSON lives in Firebase (off-chain).
 *         Every clinical action is recorded as an immutable blockchain transaction.
 *
 * ─── CRUD Function Map ────────────────────────────────────────────────────────
 *  CREATE  : registerPatient, submitSOAP, submitDoctorNote,
 *            fulfillPrescription, assignDepartment, selfRegister, assignRole
 *  READ    : getEMRActions, getRole, isRegistered, getTotalActions,
 *            getUserProfile, getActionCount, getActionByIndex, getLatestAction
 *  UPDATE  : updateRecord, updateUserName
 *  DELETE  : deactivateRecord, deactivateUser
 * ─────────────────────────────────────────────────────────────────────────────
 *  Total public/external functions : 18
 *  Modifiers                       :  4  (onlyOwner, onlyAdmin,
 *                                        onlyAuthorized, emrExists)
 *  Events                          :  8  (PatientRegistered, SOAPSubmitted,
 *                                        DoctorNoteSubmitted, PrescriptionCreated,
 *                                        DepartmentAssigned, RecordUpdated,
 *                                        RoleAssigned, RecordDeactivated)
 */
contract EMRv2 {

    // ─── Enumerations ────────────────────────────────────────────────────────

    enum ActionType {
        PATIENT_REGISTERED,     // 0
        SOAP_SUBMITTED,         // 1 — Nurse vital signs + SOAP
        DOCTOR_NOTE_SUBMITTED,  // 2 — Doctor examination + diagnosis
        PRESCRIPTION_CREATED,   // 3 — Pharmacist confirms prescription
        RECORD_UPDATED,         // 4 — Any update to an existing record
        DEPARTMENT_ASSIGNED     // 5 — Admin assigns patient to department/poli
    }

    enum Role {
        NONE,       // 0 — unregistered
        PATIENT,    // 1
        DOCTOR,     // 2
        NURSE,      // 3
        ADMIN,      // 4
        PHARMACIST  // 5
    }

    // ─── Structs ─────────────────────────────────────────────────────────────

    struct MedicalAction {
        uint256    id;          // Global auto-increment ID
        string     emrId;       // Firebase EMR ID (e.g. "EMR-20240421-00001")
        string     dataHash;    // SHA-256 hex of the off-chain JSON payload
        ActionType actionType;  // What type of clinical event this is
        address    submitter;   // Wallet address of the person who submitted
        uint256    timestamp;   // Block timestamp
        bool       isActive;    // Soft-delete flag
    }

    struct UserProfile {
        address wallet;
        Role    role;
        string  name;
        bool    active;
    }

    // ─── State Variables ─────────────────────────────────────────────────────

    uint256 public actionCount;

    // emrId => array of all actions for that patient
    mapping(string => MedicalAction[]) private emrActions;

    // emrId => whether this patient has been registered
    mapping(string => bool) public registeredEMRs;

    // wallet address => user profile
    mapping(address => UserProfile) public userProfiles;

    address public owner;

    // ─── Events ───────────────────────────────────────────────────────────────

    /// @dev Emitted when a new patient EMR is registered on-chain
    event PatientRegistered(
        string  indexed emrId,
        string          dataHash,
        address indexed registrar,
        uint256         timestamp
    );

    /// @dev Emitted when a nurse submits SOAP notes
    event SOAPSubmitted(
        string  indexed emrId,
        string          dataHash,
        address indexed nurse,
        uint256         timestamp
    );

    /// @dev Emitted when a doctor submits an examination note
    event DoctorNoteSubmitted(
        string  indexed emrId,
        string          dataHash,
        address indexed doctor,
        uint256         timestamp
    );

    /// @dev Emitted when a pharmacist records prescription fulfillment
    event PrescriptionCreated(
        string  indexed emrId,
        string          dataHash,
        address indexed pharmacist,
        uint256         timestamp
    );

    /// @dev Emitted when an admin assigns a patient to a department
    event DepartmentAssigned(
        string  indexed emrId,
        string          dataHash,
        address indexed admin,
        uint256         timestamp
    );

    /// @dev Emitted when an existing record is updated (new hash recorded)
    event RecordUpdated(
        string  indexed emrId,
        string          dataHash,
        ActionType      actionType,
        address indexed updater,
        uint256         timestamp
    );

    /// @dev Emitted when a role is assigned to a wallet
    event RoleAssigned(
        address indexed user,
        Role            role,
        string          name
    );

    /// @dev Emitted when a record entry is soft-deleted
    event RecordDeactivated(
        string  indexed emrId,
        uint256         actionIndex,
        address indexed deactivatedBy,
        uint256         timestamp
    );

    // ─── Modifiers ────────────────────────────────────────────────────────────

    /// @notice Restricts function to the contract deployer only
    modifier onlyOwner() {
        require(msg.sender == owner, "EMRv2: caller is not owner");
        _;
    }

    /// @notice Restricts function to users with ADMIN role (or owner)
    modifier onlyAdmin() {
        require(
            userProfiles[msg.sender].role == Role.ADMIN || msg.sender == owner,
            "EMRv2: caller is not admin"
        );
        _;
    }

    /// @notice Restricts function to any registered user (role != NONE)
    modifier onlyAuthorized() {
        require(
            uint8(userProfiles[msg.sender].role) > 0 || msg.sender == owner,
            "EMRv2: not an authorized user"
        );
        _;
    }

    /// @notice Validates that the given EMR ID has been registered on-chain
    modifier emrExists(string calldata emrId) {
        require(registeredEMRs[emrId], "EMRv2: EMR ID not registered");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        userProfiles[msg.sender] = UserProfile({
            wallet: msg.sender,
            role:   Role.ADMIN,
            name:   "Contract Owner",
            active: true
        });
    }

    // ════════════════════════════════════════════════════════════════════════
    //  CREATE
    // ════════════════════════════════════════════════════════════════════════

    /**
     * @notice (C1) Assign a role to a wallet address.
     * @dev    Only contract owner or existing admins may call this.
     */
    function assignRole(
        address        user,
        Role           role,
        string calldata name
    ) external onlyAdmin {
        userProfiles[user] = UserProfile({
            wallet: user,
            role:   role,
            name:   name,
            active: true
        });
        emit RoleAssigned(user, role, name);
    }

    /**
     * @notice (C2) Self-register as a PATIENT.
     *         Wallet must not already have a role.
     */
    function selfRegister(string calldata name) external {
        require(
            userProfiles[msg.sender].role == Role.NONE,
            "EMRv2: already registered"
        );
        userProfiles[msg.sender] = UserProfile({
            wallet: msg.sender,
            role:   Role.PATIENT,
            name:   name,
            active: true
        });
        emit RoleAssigned(msg.sender, Role.PATIENT, name);
    }

    /**
     * @notice (C3) Register a new patient EMR on-chain.
     * @param  emrId    The generated EMR ID from the frontend.
     * @param  dataHash SHA-256 of the full patient biodata JSON.
     */
    function registerPatient(
        string calldata emrId,
        string calldata dataHash
    ) external onlyAuthorized {
        require(!registeredEMRs[emrId], "EMRv2: EMR already registered");
        registeredEMRs[emrId] = true;
        _recordAction(emrId, dataHash, ActionType.PATIENT_REGISTERED);
        emit PatientRegistered(emrId, dataHash, msg.sender, block.timestamp);
    }

    /**
     * @notice (C4) Nurse submits SOAP (Subjective / Objective / Assessment / Plan) notes.
     * @param  emrId    Target patient's EMR ID.
     * @param  dataHash SHA-256 of the SOAP JSON payload saved to Firebase.
     */
    function submitSOAP(
        string calldata emrId,
        string calldata dataHash
    ) external onlyAuthorized emrExists(emrId) {
        _recordAction(emrId, dataHash, ActionType.SOAP_SUBMITTED);
        emit SOAPSubmitted(emrId, dataHash, msg.sender, block.timestamp);
    }

    /**
     * @notice (C5) Doctor submits examination notes and diagnosis.
     * @param  emrId    Target patient's EMR ID.
     * @param  dataHash SHA-256 of the doctor note JSON saved to Firebase.
     */
    function submitDoctorNote(
        string calldata emrId,
        string calldata dataHash
    ) external onlyAuthorized emrExists(emrId) {
        _recordAction(emrId, dataHash, ActionType.DOCTOR_NOTE_SUBMITTED);
        emit DoctorNoteSubmitted(emrId, dataHash, msg.sender, block.timestamp);
    }

    /**
     * @notice (C6) Pharmacist records prescription fulfillment.
     * @param  emrId    Target patient's EMR ID.
     * @param  dataHash SHA-256 of the prescription JSON saved to Firebase.
     */
    function fulfillPrescription(
        string calldata emrId,
        string calldata dataHash
    ) external onlyAuthorized emrExists(emrId) {
        _recordAction(emrId, dataHash, ActionType.PRESCRIPTION_CREATED);
        emit PrescriptionCreated(emrId, dataHash, msg.sender, block.timestamp);
    }

    /**
     * @notice (C7) Admin assigns a patient to a clinical department (poli).
     * @param  emrId    Target patient's EMR ID.
     * @param  dataHash SHA-256 of the assignment JSON (includes department name).
     */
    function assignDepartment(
        string calldata emrId,
        string calldata dataHash
    ) external onlyAdmin emrExists(emrId) {
        _recordAction(emrId, dataHash, ActionType.DEPARTMENT_ASSIGNED);
        emit DepartmentAssigned(emrId, dataHash, msg.sender, block.timestamp);
    }

    // ════════════════════════════════════════════════════════════════════════
    //  READ
    // ════════════════════════════════════════════════════════════════════════

    /**
     * @notice (R1) Retrieve all on-chain actions for a given EMR ID.
     *         Returns the full audit trail — every SOAP, doctor note, prescription.
     */
    function getEMRActions(
        string calldata emrId
    ) external view returns (MedicalAction[] memory) {
        return emrActions[emrId];
    }

    /**
     * @notice (R2) Get the on-chain role of a wallet address.
     */
    function getRole(address user) external view returns (Role) {
        return userProfiles[user].role;
    }

    /**
     * @notice (R3) Check whether an EMR ID is registered on-chain.
     */
    function isRegistered(string calldata emrId) external view returns (bool) {
        return registeredEMRs[emrId];
    }

    /**
     * @notice (R4) Total number of clinical actions recorded across all patients.
     */
    function getTotalActions() external view returns (uint256) {
        return actionCount;
    }

    /**
     * @notice (R5) Retrieve the full UserProfile for a wallet address.
     */
    function getUserProfile(
        address user
    ) external view returns (UserProfile memory) {
        return userProfiles[user];
    }

    /**
     * @notice (R6) Number of actions recorded for a specific EMR ID.
     */
    function getActionCount(
        string calldata emrId
    ) external view returns (uint256) {
        return emrActions[emrId].length;
    }

    /**
     * @notice (R7) Retrieve one specific action entry by index (zero-based).
     */
    function getActionByIndex(
        string calldata emrId,
        uint256         index
    ) external view returns (MedicalAction memory) {
        require(index < emrActions[emrId].length, "EMRv2: index out of range");
        return emrActions[emrId][index];
    }

    /**
     * @notice (R8) Retrieve the most recent active action for an EMR ID.
     *         Reverts if no active action exists.
     */
    function getLatestAction(
        string calldata emrId
    ) external view returns (MedicalAction memory) {
        MedicalAction[] storage actions = emrActions[emrId];
        require(actions.length > 0, "EMRv2: no actions recorded");
        // Walk backward to find the latest active entry
        for (uint256 i = actions.length; i > 0; i--) {
            if (actions[i - 1].isActive) {
                return actions[i - 1];
            }
        }
        revert("EMRv2: no active action found");
    }

    // ════════════════════════════════════════════════════════════════════════
    //  UPDATE
    // ════════════════════════════════════════════════════════════════════════

    /**
     * @notice (U1) Record an update to an existing EMR entry.
     *         Adds a new RECORD_UPDATED action with the new data hash.
     *         The old action remains immutable — full audit trail is preserved.
     * @param  emrId      Target patient's EMR ID.
     * @param  dataHash   SHA-256 of the updated off-chain JSON.
     * @param  actionType Which type of record was updated.
     */
    function updateRecord(
        string calldata emrId,
        string calldata dataHash,
        ActionType      actionType
    ) external onlyAuthorized emrExists(emrId) {
        _recordAction(emrId, dataHash, ActionType.RECORD_UPDATED);
        emit RecordUpdated(emrId, dataHash, actionType, msg.sender, block.timestamp);
    }

    /**
     * @notice (U2) Update the display name stored in a user's on-chain profile.
     *         Only the user themselves or an admin may update the name.
     */
    function updateUserName(
        address        user,
        string calldata newName
    ) external {
        require(
            msg.sender == user || userProfiles[msg.sender].role == Role.ADMIN || msg.sender == owner,
            "EMRv2: not authorized to update this profile"
        );
        require(userProfiles[user].role != Role.NONE, "EMRv2: user not registered");
        userProfiles[user].name = newName;
        emit RoleAssigned(user, userProfiles[user].role, newName);
    }

    // ════════════════════════════════════════════════════════════════════════
    //  DELETE  (soft-delete only — blockchain records are immutable by design)
    // ════════════════════════════════════════════════════════════════════════

    /**
     * @notice (D1) Soft-delete a specific action entry by setting isActive = false.
     *         The entry remains on-chain for audit purposes; queries can filter
     *         by isActive to exclude deactivated records.
     * @param  emrId       Target patient's EMR ID.
     * @param  actionIndex Zero-based index of the action to deactivate.
     */
    function deactivateRecord(
        string calldata emrId,
        uint256         actionIndex
    ) external onlyAdmin {
        require(actionIndex < emrActions[emrId].length, "EMRv2: index out of range");
        require(emrActions[emrId][actionIndex].isActive, "EMRv2: record already deactivated");
        emrActions[emrId][actionIndex].isActive = false;
        emit RecordDeactivated(emrId, actionIndex, msg.sender, block.timestamp);
    }

    /**
     * @notice (D2) Deactivate a user profile (soft-delete).
     *         The wallet can no longer submit actions but the profile is retained.
     * @param  user  Wallet address of the user to deactivate.
     */
    function deactivateUser(address user) external onlyAdmin {
        require(user != owner, "EMRv2: cannot deactivate contract owner");
        require(userProfiles[user].active, "EMRv2: user already inactive");
        userProfiles[user].active = false;
    }

    // ─── Internal Helpers ────────────────────────────────────────────────────

    function _recordAction(
        string calldata emrId,
        string calldata dataHash,
        ActionType      actionType
    ) internal {
        uint256 newId = ++actionCount;
        emrActions[emrId].push(MedicalAction({
            id:         newId,
            emrId:      emrId,
            dataHash:   dataHash,
            actionType: actionType,
            submitter:  msg.sender,
            timestamp:  block.timestamp,
            isActive:   true
        }));
    }
}
