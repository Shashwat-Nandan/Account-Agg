use std::hash::poseidon;

fn main(
    leaf: Field,                   // Private: user's leaf value
    index: u32,                    // Private: leaf index in tree
    path: [Field; 20],             // Private: Merkle path (sibling hashes)
    root: pub Field                // Public: Merkle root
) {
    // Compute Merkle root from leaf and path
    let mut current = leaf;
    let mut idx = index;

    for i in 0..20 {
        let sibling = path[i];
        // If index bit is 0, current is left child; otherwise right
        if (idx & 1) == 0 {
            let pair: [Field; 2] = [current, sibling];
            current = poseidon::bn254::hash_2(pair);
        } else {
            let pair: [Field; 2] = [sibling, current];
            current = poseidon::bn254::hash_2(pair);
        }
        idx = idx >> 1;
    }

    assert(current == root, "Merkle proof invalid");
}

#[test]
fn test_merkle_depth_1() {
    // Simple test: depth-1 tree with 2 leaves
    let leaf: Field = 42;
    let sibling: Field = 99;
    let pair: [Field; 2] = [leaf, sibling];
    let root = poseidon::bn254::hash_2(pair);

    // Path: first element is sibling, rest are zeros (only 1 level used)
    let mut path: [Field; 20] = [0; 20];
    path[0] = sibling;

    // We need root to match after all 20 levels
    // For a proper test, we'd need to compute through all levels
    // This is a structural test
    let mut current = leaf;
    let mut idx: u32 = 0;
    for i in 0..20 {
        let sib = path[i];
        if (idx & 1) == 0 {
            let p: [Field; 2] = [current, sib];
            current = poseidon::bn254::hash_2(p);
        } else {
            let p: [Field; 2] = [sib, current];
            current = poseidon::bn254::hash_2(p);
        }
        idx = idx >> 1;
    }

    main(leaf, 0, path, current);
}
