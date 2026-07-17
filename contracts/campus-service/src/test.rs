#![cfg(test)]

use super::*;
use campus_token::{CampusToken, CampusTokenClient};
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
