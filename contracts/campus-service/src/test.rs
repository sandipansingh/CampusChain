#![cfg(test)]

use super::*;
use campus_token::{CampusToken, CampusTokenClient};
use campus_identity::{CampusIdentity, CampusIdentityClient};
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_escrow_workflow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);

    // Register token contract
    let token_id = env.register_contract(None, CampusToken);
    let token_client = CampusTokenClient::new(&env, &token_id);
    let name = String::from_str(&env, "Campus Token");
    let symbol = String::from_str(&env, "CAMP");
    token_client.initialize(&admin, &name, &symbol, &7);

    // Register service contract
    let service_id = env.register_contract(None, CampusService);
    let service_client = CampusServiceClient::new(&env, &service_id);
    service_client.initialize(&admin, &token_id);

    // Mint tokens to buyer
    token_client.mint(&buyer, &1000i128);

    // Buyer approves service contract to spend tokens
    token_client.approve(&buyer, &service_id, &500i128, &1000);

    // Create Escrow (locks 300 tokens in service contract)
    let escrow_id = service_client.create_escrow(&buyer, &seller, &300i128);
    assert_eq!(token_client.balance(&buyer), 700i128);
    assert_eq!(token_client.balance(&service_id), 300i128);

    let escrow = service_client.get_escrow(&escrow_id);
    assert_eq!(escrow.buyer, buyer);
    assert_eq!(escrow.seller, seller);
    assert_eq!(escrow.amount, 300i128);
    assert_eq!(escrow.status, 1); // Funded

    // Release Escrow (buyer releases to seller)
    service_client.release_escrow(&escrow_id, &buyer);
    assert_eq!(token_client.balance(&service_id), 0i128);
    assert_eq!(token_client.balance(&seller), 300i128);

    let escrow_after = service_client.get_escrow(&escrow_id);
    assert_eq!(escrow_after.status, 2); // Completed
}

#[test]
fn test_escrow_refund_workflow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);

    let token_id = env.register_contract(None, CampusToken);
    let token_client = CampusTokenClient::new(&env, &token_id);
    let name = String::from_str(&env, "Campus Token");
    let symbol = String::from_str(&env, "CAMP");
    token_client.initialize(&admin, &name, &symbol, &7);

    let service_id = env.register_contract(None, CampusService);
    let service_client = CampusServiceClient::new(&env, &service_id);
    service_client.initialize(&admin, &token_id);

    token_client.mint(&buyer, &1000i128);
    token_client.approve(&buyer, &service_id, &500i128, &1000);

    let escrow_id = service_client.create_escrow(&buyer, &seller, &300i128);

    // Seller refunds back to buyer
    service_client.refund_escrow(&escrow_id, &seller);
    assert_eq!(token_client.balance(&service_id), 0i128);
    assert_eq!(token_client.balance(&buyer), 1000i128);

    let escrow = service_client.get_escrow(&escrow_id);
    assert_eq!(escrow.status, 3); // Refunded
}

#[test]
fn test_event_ticketing_workflow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let host = Address::generate(&env);
    let buyer = Address::generate(&env);

    let token_id = env.register_contract(None, CampusToken);
    let token_client = CampusTokenClient::new(&env, &token_id);
    let name = String::from_str(&env, "Campus Token");
    let symbol = String::from_str(&env, "CAMP");
    token_client.initialize(&admin, &name, &symbol, &7);

    let service_id = env.register_contract(None, CampusService);
    let service_client = CampusServiceClient::new(&env, &service_id);
    service_client.initialize(&admin, &token_id);

    // Set host role to Club (3)
    token_client.set_role(&admin, &host, &3);

    // Create Event
    let event_id = service_client.create_event(&host, &50i128, &100u32);
    let event = service_client.get_event(&event_id);
    assert_eq!(event.host, host);
    assert_eq!(event.price, 50i128);
    assert_eq!(event.capacity, 100);
    assert_eq!(event.tickets_sold, 0);

    // Mint tokens to buyer & approve
    token_client.mint(&buyer, &200i128);
    token_client.approve(&buyer, &service_id, &100i128, &1000);

    // Buy Ticket
    let ticket_id = service_client.buy_ticket(&event_id, &buyer);
    let ticket = service_client.get_ticket(&ticket_id);
    assert_eq!(ticket.event_id, event_id);
    assert_eq!(ticket.owner, buyer);
    assert_eq!(ticket.redeemed, false);

    assert_eq!(token_client.balance(&buyer), 150i128);
    assert_eq!(token_client.balance(&host), 50i128);

    let event_after = service_client.get_event(&event_id);
    assert_eq!(event_after.tickets_sold, 1);

    // Redeem Ticket
    service_client.redeem_ticket(&ticket_id, &host);
    let ticket_after = service_client.get_ticket(&ticket_id);
    assert_eq!(ticket_after.redeemed, true);
}

#[test]
fn test_buy_camp_tokens() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);

    let token_id = env.register_contract(None, CampusToken);
    let token_client = CampusTokenClient::new(&env, &token_id);
    let name = String::from_str(&env, "Campus Token");
    let symbol = String::from_str(&env, "CAMP");
    token_client.initialize(&admin, &name, &symbol, &7);

    let service_id = env.register_contract(None, CampusService);
    let service_client = CampusServiceClient::new(&env, &service_id);
    service_client.initialize(&admin, &token_id);

    assert_eq!(token_client.balance(&buyer), 0i128);

    // Buy 5 XLM worth of CAMP (1 XLM = 100 CAMP => 500 CAMP)
    let xlm_stroops = 5i128 * 10i128.pow(7); // 5 XLM in stroops
    let expected_camp = xlm_stroops * 100; // 500 CAMP in stroops

    service_client.buy_camp_tokens(&buyer, &xlm_stroops);

    assert_eq!(token_client.balance(&buyer), expected_camp);

    // Verify below minimum fails
    let too_small = 1i128; // way below 1 XLM minimum
    let result = service_client.try_buy_camp_tokens(&buyer, &too_small);
    assert!(result.is_err());
}

#[test]
fn test_marketplace_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);

    let token_id = env.register_contract(None, CampusToken);
    let token_client = CampusTokenClient::new(&env, &token_id);
    let name = String::from_str(&env, "Campus Token");
    let symbol = String::from_str(&env, "CAMP");
    token_client.initialize(&admin, &name, &symbol, &7);

    let service_id = env.register_contract(None, CampusService);
    let service_client = CampusServiceClient::new(&env, &service_id);
    service_client.initialize(&admin, &token_id);

    // Register service contract in token
    token_client.set_service_contract(&admin, &service_id);

    // Set roles: buyer is Student (1), seller is Merchant (2)
    token_client.set_role(&admin, &buyer, &1);
    token_client.set_role(&admin, &seller, &2);

    // Seller creates listing
    let title = String::from_str(&env, "Textbook");
    let desc = String::from_str(&env, "Used college textbook");
    let listing_id = service_client.create_listing(&seller, &title, &desc, &200i128, &1u32, &true);

    let listing = service_client.get_listing(&listing_id);
    assert_eq!(listing.seller, seller);
    assert_eq!(listing.price, 200i128);
    assert_eq!(listing.status, 1); // Active

    // Mint tokens to buyer & approve service
    token_client.mint(&buyer, &500i128);
    token_client.approve(&buyer, &service_id, &200i128, &1000);

    // Buy Listing (locks funds in escrow)
    service_client.buy_listing(&listing_id, &buyer);

    let listing_after = service_client.get_listing(&listing_id);
    assert_eq!(listing_after.status, 2); // Sold

    // Verify escrow was created (escrow counter should be 1)
    let escrow = service_client.get_escrow(&1u64);
    assert_eq!(escrow.buyer, buyer);
    assert_eq!(escrow.seller, seller);
    assert_eq!(escrow.amount, 200i128);
    assert_eq!(escrow.status, 1); // Funded

    // Buyer releases escrow
    service_client.release_escrow(&1u64, &buyer);
    assert_eq!(token_client.balance(&seller), 200i128);

    let escrow_after = service_client.get_escrow(&1u64);
    assert_eq!(escrow_after.status, 2); // Completed
}

#[test]
fn test_scholarship_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let student = Address::generate(&env);

    let token_id = env.register_contract(None, CampusToken);
    let token_client = CampusTokenClient::new(&env, &token_id);
    let name = String::from_str(&env, "Campus Token");
    let symbol = String::from_str(&env, "CAMP");
    token_client.initialize(&admin, &name, &symbol, &7);

    let service_id = env.register_contract(None, CampusService);
    let service_client = CampusServiceClient::new(&env, &service_id);
    service_client.initialize(&admin, &token_id);

    token_client.set_service_contract(&admin, &service_id);

    // Set roles
    token_client.set_role(&admin, &student, &1); // Student
    token_client.set_role(&admin, &admin, &4); // Admin

    // Mint CAMP to admin and approve service contract
    token_client.mint(&admin, &2000i128);
    token_client.approve(&admin, &service_id, &1000i128, &1000);

    // Create scholarship program
    let program_id = service_client.create_scholarship_program(
        &admin,
        &String::from_str(&env, "GPA Scholarship"),
        &1000i128,
        &380u32, // min GPA 3.8
    );

    let program = service_client.get_scholarship_program(&program_id);
    assert_eq!(program.amount, 1000i128);
    assert_eq!(program.min_gpa, 380u32);
    assert!(program.active);

    // Student applies
    let app_id = service_client.apply_for_scholarship(&student, &program_id, &390u32);

    let app = service_client.get_scholarship_application(&app_id);
    assert_eq!(app.applicant, student);
    assert_eq!(app.gpa, 390u32);
    assert_eq!(app.status, 0); // Applied

    // Admin reviews and approves
    service_client.review_scholarship_application(&admin, &app_id, &true);
    let app_after = service_client.get_scholarship_application(&app_id);
    assert_eq!(app_after.status, 2); // Approved

    // Admin disburses
    service_client.disburse_scholarship(&admin, &app_id);
    assert_eq!(token_client.balance(&student), 1000i128);

    let app_final = service_client.get_scholarship_application(&app_id);
    assert_eq!(app_final.status, 4); // Disbursed

    let program_final = service_client.get_scholarship_program(&program_id);
    assert!(!program_final.active); // Program finished
}

#[test]
fn test_rewards_redemption_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let student = Address::generate(&env);
    let merchant = Address::generate(&env);

    let token_id = env.register_contract(None, CampusToken);
    let token_client = CampusTokenClient::new(&env, &token_id);
    let name = String::from_str(&env, "Campus Token");
    let symbol = String::from_str(&env, "CAMP");
    token_client.initialize(&admin, &name, &symbol, &7);

    let service_id = env.register_contract(None, CampusService);
    let service_client = CampusServiceClient::new(&env, &service_id);
    service_client.initialize(&admin, &token_id);

    token_client.set_service_contract(&admin, &service_id);

    // Set roles
    token_client.set_role(&admin, &student, &1); // Student
    token_client.set_role(&admin, &merchant, &2); // Merchant
    token_client.set_role(&admin, &admin, &4); // Admin

    // Create utility reward item
    let reward_id = service_client.create_utility_reward(
        &admin,
        &String::from_str(&env, "Cafeteria Voucher"),
        &50i128,
        &5u32, // stock 5
    );

    let reward = service_client.get_utility_reward(&reward_id);
    assert_eq!(reward.cost_camp, 50i128);
    assert_eq!(reward.stock, 5u32);

    // Mint CAMP to student and approve service contract
    token_client.mint(&student, &100i128);
    token_client.approve(&student, &service_id, &50i128, &1000);

    // Student redeems reward
    let red_id = service_client.redeem_reward(&student, &reward_id);

    // Check balances (student paid 50 CAMP, which got burned)
    assert_eq!(token_client.balance(&student), 50i128);
    assert_eq!(token_client.total_supply(), 50i128); // 100 - 50 = 50 (burned)

    let reward_after = service_client.get_utility_reward(&reward_id);
    assert_eq!(reward_after.stock, 4u32);

    let redemption = service_client.get_redemption(&red_id);
    assert_eq!(redemption.student, student);
    assert_eq!(redemption.status, 1); // Redeemed

    // Merchant fulfills redemption
    service_client.fulfill_redemption(&merchant, &red_id);

    let redemption_after = service_client.get_redemption(&red_id);
    assert_eq!(redemption_after.status, 2); // Fulfilled
}

#[test]
fn test_access_control_and_invalid_transitions() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let student = Address::generate(&env);

    let token_id = env.register_contract(None, CampusToken);
    let token_client = CampusTokenClient::new(&env, &token_id);
    let name = String::from_str(&env, "Campus Token");
    let symbol = String::from_str(&env, "CAMP");
    token_client.initialize(&admin, &name, &symbol, &7);

    let service_id = env.register_contract(None, CampusService);
    let service_client = CampusServiceClient::new(&env, &service_id);
    service_client.initialize(&admin, &token_id);

    token_client.set_service_contract(&admin, &service_id);

    token_client.set_role(&admin, &student, &1);
    token_client.set_role(&admin, &admin, &4);

    // 1. Non-admin trying to create scholarship program (fails)
    let result = service_client.try_create_scholarship_program(
        &student,
        &String::from_str(&env, "Hackathon Grant"),
        &1000i128,
        &380u32,
    );
    assert!(result.is_err());

    // Setup program
    token_client.mint(&admin, &1000i128);
    token_client.approve(&admin, &service_id, &1000i128, &1000);
    let program_id = service_client.create_scholarship_program(
        &admin,
        &String::from_str(&env, "Hackathon Grant"),
        &1000i128,
        &380u32,
    );

    // 2. Student with GPA below minimum trying to apply (fails)
    let result = service_client.try_apply_for_scholarship(&student, &program_id, &370u32);
    assert!(result.is_err());

    // 3. Unauthorized caller tries to call mint_purchase directly on CampusToken (fails)
    let result = token_client.try_mint_purchase(&admin, &student, &100i128);
    assert!(result.is_err());

    // 4. Double release of escrow fails
    let buyer = Address::generate(&env);
    let seller = Address::generate(&env);
    token_client.mint(&buyer, &500i128);
    token_client.approve(&buyer, &service_id, &500i128, &1000);

    let escrow_id = service_client.create_escrow(&buyer, &seller, &300i128);
    service_client.release_escrow(&escrow_id, &buyer);

    // Second release attempt should fail
    let result_second = service_client.try_release_escrow(&escrow_id, &buyer);
    assert!(result_second.is_err());
}

#[test]
fn test_identity_contract_integration() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let student = Address::generate(&env);
    let seller = Address::generate(&env);

    // Register token contract
    let token_id = env.register_contract(None, CampusToken);
    let token_client = CampusTokenClient::new(&env, &token_id);
    let name = String::from_str(&env, "Campus Token");
    let symbol = String::from_str(&env, "CAMP");
    token_client.initialize(&admin, &name, &symbol, &7);

    // Register identity contract
    let identity_id = env.register_contract(None, CampusIdentity);
    let identity_client = CampusIdentityClient::new(&env, &identity_id);
    identity_client.initialize(
        &admin,
        &String::from_str(&env, "Admin User"),
        &123u64,
        &String::from_str(&env, "Administration"),
    );

    // Register service contract
    let service_id = env.register_contract(None, CampusService);
    let service_client = CampusServiceClient::new(&env, &service_id);
    service_client.initialize(&admin, &token_id);

    // Link identity contract to service contract
    service_client.set_identity_contract(&admin, &identity_id);
    assert_eq!(service_client.identity_contract(), Some(identity_id.clone()));

    // 1. Trying to create a listing when seller does not have a profile in identity contract fails
    let result = service_client.try_create_listing(
        &seller,
        &String::from_str(&env, "Textbook"),
        &String::from_str(&env, "Math 101"),
        &50i128,
        &1u32,
        &false,
    );
    assert!(result.is_err());

    // Register profiles in Identity contract
    identity_client.register_profile(
        &seller,
        &String::from_str(&env, "Bob Merchant"),
        &456u64,
        &String::from_str(&env, "Business"),
    );
    identity_client.register_profile(
        &student,
        &String::from_str(&env, "Alice Student"),
        &789u64,
        &String::from_str(&env, "Engineering"),
    );

    // Now Bobs' listing creation succeeds
    let listing_id = service_client.create_listing(
        &seller,
        &String::from_str(&env, "Textbook"),
        &String::from_str(&env, "Math 101"),
        &50i128,
        &1u32,
        &false,
    );
    assert_eq!(listing_id, 1);

    // 2. Scholarship application: fails if student profile is not verified
    token_client.mint(&admin, &1000i128);
    token_client.approve(&admin, &service_id, &1000i128, &1000);

    let program_id = service_client.create_scholarship_program(
        &admin,
        &String::from_str(&env, "Engineering Grant"),
        &500i128,
        &350u32,
    );
    let app_result = service_client.try_apply_for_scholarship(&student, &program_id, &380u32);
    assert!(app_result.is_err()); // fails because student is not verified yet

    // Admin verifies the student profile
    identity_client.set_verified(&admin, &student, &true);

    // Now application succeeds
    let app_id = service_client.apply_for_scholarship(&student, &program_id, &380u32);
    assert_eq!(app_id, 1);
}
