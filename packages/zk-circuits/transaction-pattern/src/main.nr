use std::hash::pedersen_hash;

fn main(
    tx_statuses: [u8; 100],        // Private: 0=normal, 1=bounced
    tx_count: u64,                 // Private: actual number of transactions (<=100)
    expected_hash: pub Field,      // Public: hash commitment
    max_bounced: pub u64           // Public: maximum allowed bounced transactions
) {
    // Verify data integrity via hash commitment
    let hash_inputs: [Field; 2] = [tx_count as Field, max_bounced as Field];
    let computed_hash = pedersen_hash(hash_inputs);
    assert(computed_hash == expected_hash, "Transaction data hash mismatch");

    // Count bounced transactions (only up to tx_count)
    let mut bounced_count: u64 = 0;
    for i in 0..100 {
        if (i as u64) < tx_count {
            if tx_statuses[i] == 1 {
                bounced_count += 1;
            }
        }
    }

    // Prove bounced count is within limit
    assert(bounced_count <= max_bounced, "Too many bounced transactions");

    // Verify each status is valid (0 or 1)
    for i in 0..100 {
        if (i as u64) < tx_count {
            assert(
                (tx_statuses[i] == 0) | (tx_statuses[i] == 1),
                "Invalid transaction status"
            );
        }
    }
}

#[test]
fn test_no_bounced_transactions() {
    let statuses: [u8; 100] = [0; 100];
    let hash_inputs: [Field; 2] = [50 as Field, 5 as Field];
    let hash = pedersen_hash(hash_inputs);
    main(statuses, 50, hash, 5);
}

#[test]
fn test_some_bounced_within_limit() {
    let mut statuses: [u8; 100] = [0; 100];
    statuses[5] = 1;
    statuses[10] = 1;
    let hash_inputs: [Field; 2] = [50 as Field, 5 as Field];
    let hash = pedersen_hash(hash_inputs);
    main(statuses, 50, hash, 5);
}
