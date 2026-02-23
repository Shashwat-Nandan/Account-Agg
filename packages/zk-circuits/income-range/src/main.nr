use std::hash::poseidon;

fn main(
    monthly_credits: [u64; 12],          // Private: actual monthly income
    data_hash: Field,                     // Private: hash of source FI data
    min_income: pub u64,                  // Public: lower bound
    max_income: pub u64,                  // Public: upper bound
    expected_data_hash: pub Field         // Public: verifier checks integrity
) {
    // Verify data integrity against AA-provided commitment
    let mut hash_inputs: [Field; 12] = [0; 12];
    for i in 0..12 {
        hash_inputs[i] = monthly_credits[i] as Field;
    }
    let computed_hash = poseidon::bn254::hash_12(hash_inputs);
    assert(computed_hash == expected_data_hash, "Data hash mismatch");
    assert(data_hash == expected_data_hash, "Data hash integrity check failed");

    // Compute and range-check total income
    let mut total: u64 = 0;
    for i in 0..12 {
        total += monthly_credits[i];
    }
    assert(total >= min_income, "Income below minimum");
    assert(total <= max_income, "Income above maximum");
}

#[test]
fn test_valid_income_range() {
    let credits: [u64; 12] = [50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000];
    let mut hash_inputs: [Field; 12] = [0; 12];
    for i in 0..12 {
        hash_inputs[i] = credits[i] as Field;
    }
    let hash = poseidon::bn254::hash_12(hash_inputs);
    main(credits, hash, 500000, 700000, hash);
}
