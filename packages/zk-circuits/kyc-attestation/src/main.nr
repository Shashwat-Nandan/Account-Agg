use std::hash::poseidon;

fn main(
    name_hash: Field,              // Private: Poseidon hash of name
    dob_hash: Field,               // Private: Poseidon hash of DOB
    pan_hash: Field,               // Private: Poseidon hash of PAN
    provider: u8,                  // Private: KYC provider (1=PAN, 2=DigiLocker, 3=Aadhaar, 4=CKYC)
    timestamp: u64,                // Private: verification timestamp
    attestation_hash: pub Field,   // Public: expected attestation hash
    min_provider_level: pub u8     // Public: minimum required provider level
) {
    // Compute attestation from private inputs
    let hash_inputs: [Field; 5] = [
        name_hash,
        dob_hash,
        pan_hash,
        provider as Field,
        timestamp as Field,
    ];
    let computed_attestation = poseidon::bn254::hash_5(hash_inputs);

    // Verify attestation matches
    assert(computed_attestation == attestation_hash, "Attestation hash mismatch");

    // Verify provider meets minimum level
    assert(provider >= min_provider_level, "Provider level insufficient");
}

#[test]
fn test_aadhaar_kyc_attestation() {
    let name_hash: Field = 111;
    let dob_hash: Field = 222;
    let pan_hash: Field = 333;
    let provider: u8 = 3; // Aadhaar
    let timestamp: u64 = 1700000000;

    let hash_inputs: [Field; 5] = [name_hash, dob_hash, pan_hash, provider as Field, timestamp as Field];
    let attestation = poseidon::bn254::hash_5(hash_inputs);

    main(name_hash, dob_hash, pan_hash, provider, timestamp, attestation, 2);
}
