// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EMRv2 — Multi-Role Electronic Medical Record
 * @author Ervandy Rangganata (NIM: 0706012414015)
 * @notice Stores only SHA-256 hashes of medical data on-chain.
 *         Full medical JSON lives in Firebase (off-chain).
 *         Every clinical action is recorded as an immutable blockchain transaction.
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

    /**
     * @notice Every clinical action creates one MedicalAction entry.
     *         emrId ties the action back to the Firebase patient record.
     */
    struct MedicalAction {
        uint256    id;          // Global auto-increment ID
        string     emrId;       // Firebase EMR ID (e.g. "EMR-20240421-00001")
        string     dataHash;    // SHA-256 hex of the off-chain JSON payload
        ActionType actionType;  // What type of clinical event this is
        address    submitter;   // Wallet address of the person who submitted
        uint256    timestamp;   // Block timestamp
        bool       isActive;    // Soft-delete flag (always true for new records)
    }

    struct UserProfile {
        address wallet;
        Role    role;
        string  name;
        bool    active;
    }

    // ─── State Variables ─────────────────────────────────────────────────────

    // Global action counter (starts at 1)
    uint256 public actionCount;

    // emrId => array of all actions for that patient
    mapping(string => MedicalAction[]) private emrActions;

    // emrId => whether this patient has been registered
    mapping(string => bool) public registeredEMRs;

    // wallet address => user profile
    mapping(address => UserProfile) public userProfiles;

    // The contract deployer becomes the first admin
    address public owner;

    // ─── Events ───────────────────────────────────────────────────────────────

    event PatientRegistered(
        string  indexed emrId,
        string          dataHash,
        address indexed registrar,
        uint256         timestamp
    );

    event SOAPSubmitted(
        string  indexed emrId,
        string          dataHash,
        address indexed nurse,
        uint256         timestamp
    );

    event DoctorNoteSubmitted(
        string  indexed emrId,
        string          dataHash,
        address indexed doctor,
        uint256         timestamp
    );

    event PrescriptionCreated(
        string  indexed emrId,
        string          dataHash,
        address indexed pharmacist,
        uint256         timestamp
    );

    event DepartmentAssigned(
        string  indexed emrId,
        string          dataHash,
        address indexed admin,
        uint256         timestamp
    );

    event RecordUpdated(
        string  indexed emrId,
        string          dataHash,
        ActionType      actionType,
        address indexed updater,
        uint256         timestamp
    );

    event RoleAssigned(
        address indexed user,
        Role            role,
        string          name
    );

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "EMRv2: caller is not owner");
        _;
    }

    modifier onlyAdmin() {
        require(
            userProfiles[msg.sender].role == Role.ADMIN || msg.sender == owner,
            "EMRv2: caller is not admin"
        );
        _;
    }

    modifier onlyAuthorized() {
        require(
            uint8(userProfiles[msg.sender].role) > 0 || msg.sender == owner,
            "EMRv2: not an authorized user"
        );
        _;
    }

    modifier emrExists(string calldata emrId) {
        require(registeredEMRs[emrId], "EMRv2: EMR ID not registered");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        // Deployer auto-gets ADMIN role
        userProfiles[msg.sender] = UserProfile({
            wallet: msg.sender,
            role:   Role.ADMIN,
            name:   "Contract Owner",
            active: true
        });
    }

    // ─── Role Management ─────────────────────────────────────────────────────

    /**
     * @notice Assign a role to a wallet address.
     * @dev Only the contract owner or existing admins can assign roles.
     */
    function assignRole(
        address user,
        Role    role,
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
     * @notice Allow anyone to self-register as a patient (role will be PATIENT).
     *         Admin can later upgrade/change role if needed.
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

    // ─── Clinical Actions ────────────────────────────────────────────────────

    /**
     * @notice Register a new patient EMR on-chain (called after Firebase write).
     * @param emrId    The generated EMR ID from the frontend.
     * @param dataHash SHA-256 of the full patient biodata JSON.
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
     * @notice Nurse submits SOAP (Subjective/Objective/Assessment/Plan) notes.
     * @param emrId    Target patient's EMR ID.
     * @param dataHash SHA-256 of the SOAP JSON payload saved to Firebase.
     */
    function submitSOAP(
        string calldata emrId,
        string calldata dataHash
    ) external onlyAuthorized emrExists(emrId) {
        _recordAction(emrId, dataHash, ActionType.SOAP_SUBMITTED);
        emit SOAPSubmitted(emrId, dataHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Doctor submits examination notes and diagnosis.
     * @param emrId    Target patient's EMR ID.
     * @param dataHash SHA-256 of the doctor note JSON saved to Firebase.
     */
    function submitDoctorNote(
        string calldata emrId,
        string calldata dataHash
    ) external onlyAuthorized emrExists(emrId) {
        _recordAction(emrId, dataHash, ActionType.DOCTOR_NOTE_SUBMITTED);
        emit DoctorNoteSubmitted(emrId, dataHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Pharmacist records prescription fulfillment.
     * @param emrId    Target patient's EMR ID.
     * @param dataHash SHA-256 of the prescription JSON saved to Firebase.
     */
    function fulfillPrescription(
        string calldata emrId,
        string calldata dataHash
    ) external onlyAuthorized emrExists(emrId) {
        _recordAction(emrId, dataHash, ActionType.PRESCRIPTION_CREATED);
        emit PrescriptionCreated(emrId, dataHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Admin assigns a patient to a department (poli).
     * @param emrId    Target patient's EMR ID.
     * @param dataHash SHA-256 of the assignment JSON (includes department name).
     */
    function assignDepartment(
        string calldata emrId,
        string calldata dataHash
    ) external onlyAdmin emrExists(emrId) {
        _recordAction(emrId, dataHash, ActionType.DEPARTMENT_ASSIGNED);
        emit DepartmentAssigned(emrId, dataHash, msg.sender, block.timestamp);
    }

    // ─── Queries ─────────────────────────────────────────────────────────────

    /**
     * @notice Retrieve all on-chain actions for a given EMR ID.
     * @dev Returns the full audit trail — every SOAP, doctor note, prescription.
     */
    function getEMRActions(
        string calldata emrId
    ) external view returns (MedicalAction[] memory) {
        return emrActions[emrId];
    }

    /**
     * @notice Get the role of a wallet address.
     */
    function getRole(address user) external view returns (Role) {
        return userProfiles[user].role;
    }

    /**
     * @notice Check whether an EMR ID is registered on-chain.
     */
    function isRegistered(string calldata emrId) external view returns (bool) {
        return registeredEMRs[emrId];
    }

    /**
     * @notice Total number of clinical actions recorded across all patients.
     */
    function getTotalActions() external view returns (uint256) {
        return actionCount;
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
