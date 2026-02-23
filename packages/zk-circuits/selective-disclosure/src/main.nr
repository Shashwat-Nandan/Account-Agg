use std::hash::poseidon;

fn main(
    fields: [Field; 5],                  // Private: all account fields
    disclosure_mask: pub u8,             // Public: bitmask of revealed fields
    disclosed_values: pub [Field; 5],    // Public: values claimed to be revealed
    record_hash: pub Field               // Public: hash of all fields
) {
    // Verify record hash matches private fields
    let computed_hash = poseidon::bn254::hash_5(fields);
    assert(computed_hash == record_hash, "Record hash mismatch");

    // For each bit in mask, verify disclosed value matches private field
    for i in 0..5 {
        let bit = (disclosure_mask >> (i as u8)) & 1;
        if bit == 1 {
            assert(
                disclosed_values[i] == fields[i],
                "Disclosed value mismatch"
            );
        }
    }
}

#[test]
fn test_selective_disclosure() {
    let fields: [Field; 5] = [100, 200, 300, 400, 500];
    let hash = poseidon::bn254::hash_5(fields);

    // Disclose fields 0 and 2 (mask = 0b00101 = 5)
    let disclosed: [Field; 5] = [100, 0, 300, 0, 0];
    main(fields, 5, disclosed, hash);
}
