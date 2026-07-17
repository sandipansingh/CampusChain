#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_initialize_and_metadata() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let token_id = env.register_contract(None, CampusToken);
    let client = CampusTokenClient::new(&env, &token_id);

    let name = String::from_str(&env, "Campus Token");
    let symbol = String::from_str(&env, "CAMP");

    client.initialize(&admin, &name, &symbol, &7);

    assert_eq!(client.admin(), admin);
    assert_eq!(client.name(), name);
    assert_eq!(client.symbol(), symbol);
    assert_eq!(client.decimals(), 7);
    assert_eq!(client.total_supply(), 0);
}

#[test]
fn test_mint_and_burn() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    let token_id = env.register_contract(None, CampusToken);
    let client = CampusTokenClient::new(&env, &token_id);

    let name = String::from_str(&env, "Campus Token");
    let symbol = String::from_str(&env, "CAMP");
    client.initialize(&admin, &name, &symbol, &7);

    // Mint tokens
    client.mint(&user, &1000i128);
    assert_eq!(client.balance(&user), 1000i128);
    assert_eq!(client.total_supply(), 1000i128);

    // Burn tokens
    client.burn(&user, &400i128);
    assert_eq!(client.balance(&user), 600i128);
    assert_eq!(client.total_supply(), 600i128);
}

#[test]
fn test_transfer_and_allowance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user1 = Address::generate(&env);
    let user2 = Address::generate(&env);
    let spender = Address::generate(&env);

    let token_id = env.register_contract(None, CampusToken);
    let client = CampusTokenClient::new(&env, &token_id);

    let name = String::from_str(&env, "Campus Token");
    let symbol = String::from_str(&env, "CAMP");
    client.initialize(&admin, &name, &symbol, &7);

    client.mint(&user1, &1000i128);

    // Direct Transfer
    client.transfer(&user1, &user2, &300i128);
    assert_eq!(client.balance(&user1), 700i128);
    assert_eq!(client.balance(&user2), 300i128);

    // Approval and Spender Transfer
    client.approve(&user1, &spender, &200i128, &1000);
    assert_eq!(client.allowance(&user1, &spender), 200i128);

    client.transfer_from(&spender, &user1, &user2, &150i128);
    assert_eq!(client.balance(&user1), 550i128);
    assert_eq!(client.balance(&user2), 450i128);
    assert_eq!(client.allowance(&user1, &spender), 50i128);
}

#[test]
fn test_rbac_roles() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    let token_id = env.register_contract(None, CampusToken);
    let client = CampusTokenClient::new(&env, &token_id);

    let name = String::from_str(&env, "Campus Token");
    let symbol = String::from_str(&env, "CAMP");
    client.initialize(&admin, &name, &symbol, &7);

    // Default role should be Guest (0)
    assert_eq!(client.get_role(&user), 0);

    // Admin sets user to Student (1)
    client.set_role(&admin, &user, &1);
    assert_eq!(client.get_role(&user), 1);

    // User can self-assign Student (1)
    client.set_role(&user, &user, &1);
    assert_eq!(client.get_role(&user), 1);

    // Admin sets user to Merchant (2)
    client.set_role(&admin, &user, &2);
    assert_eq!(client.get_role(&user), 2);

    // Non-admin cannot set role >= 2
    let result = client.try_set_role(&user, &user, &3);
    assert!(result.is_err());
}

#[test]
fn test_role_change_request_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    let token_id = env.register_contract(None, CampusToken);
    let client = CampusTokenClient::new(&env, &token_id);

    let name = String::from_str(&env, "Campus Token");
    let symbol = String::from_str(&env, "CAMP");
    client.initialize(&admin, &name, &symbol, &7);

    // Guest (0) requests Merchant (2)
    let req_id = client.request_role_change(&user, &2);
    assert!(req_id > 0);

    let req = client.get_role_request(&req_id);
    assert_eq!(req.applicant, user);
    assert_eq!(req.requested_role, 2);
    assert_eq!(req.status, 0);

    // Cannot request role < 2
    assert!(client.try_request_role_change(&user, &1).is_err());

    // Admin approves
    client.approve_role_change(&req_id, &admin);
    assert_eq!(client.get_role(&user), 2);

    let req_after = client.get_role_request(&req_id);
    assert_eq!(req_after.status, 1);
}

#[test]
fn test_role_change_request_deny() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    let token_id = env.register_contract(None, CampusToken);
    let client = CampusTokenClient::new(&env, &token_id);

    let name = String::from_str(&env, "Campus Token");
    let symbol = String::from_str(&env, "CAMP");
    client.initialize(&admin, &name, &symbol, &7);

    // User requests Club (3) — but they're Guest (0)
    let req_id = client.request_role_change(&user, &3);

    // Admin denies
    client.deny_role_change(&req_id, &admin);
    assert_eq!(client.get_role(&user), 0); // role unchanged

    let req = client.get_role_request(&req_id);
    assert_eq!(req.status, 2);
}

#[test]
fn test_faucet_claim_and_has_claimed() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    let token_id = env.register_contract(None, CampusToken);
    let client = CampusTokenClient::new(&env, &token_id);

    let name = String::from_str(&env, "Campus Token");
    let symbol = String::from_str(&env, "CAMP");
    client.initialize(&admin, &name, &symbol, &7);

    // Before claim: has_claimed should be false, balance 0
    assert!(!client.has_claimed_faucet(&user));
    assert_eq!(client.balance(&user), 0i128);

    // Claim 100 CAMP (100 * 10^7 stroops)
    let amount = 100 * 10i128.pow(7);
    client.faucet(&user, &amount);
    assert_eq!(client.balance(&user), amount);

    // After claim: has_claimed should be true
    assert!(client.has_claimed_faucet(&user));

    // Double claim should fail with AlreadyClaimed error
    let result = client.try_faucet(&user, &amount);
    assert!(result.is_err());
}
