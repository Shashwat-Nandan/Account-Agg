use std::hash::poseidon;

fn main(
    balance: u64,                  // Private: actual account balance
    account_hash: Field,           // Private: hash of account data
    threshold: pub u64,            // Public: minimum required balance
    expected_hash: pub Field       // Public: hash commitment from AA
) {
    // Verify data integrity
    let hash_inputs: [Field; 2] = [balance as Field, account_hash];
    let computed_hash = poseidon::bn254::hash_2(hash_inputs);
    assert(computed_hash == expected_hash, "Account hash mismatch");

    // Prove balance meets threshold
    assert(balance >= threshold, "Balance below threshold");
}

#[test]
fn test_balance_above_threshold() {
    let balance: u64 = 100000;
    let account_hash: Field = 12345;
    let hash_inputs: [Field; 2] = [balance as Field, account_hash];
    let hash = poseidon::bn254::hash_2(hash_inputs);
    main(balance, account_hash, 50000, hash);
}
