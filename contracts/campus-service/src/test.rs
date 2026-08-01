use super::*;
use campus_identity::{
    CampusIdentity, CampusIdentityClient, EventOrganizerDetails, MerchantCategory, MerchantDetails,
    ProfileDetails, StudentDetails, UserRole,
};
use campus_token::{CampusToken, CampusTokenClient};
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env, String};

fn text(env: &Env, value: &str) -> String {
    String::from_str(env, value)
}

fn student_details(env: &Env, hash_val: u8) -> ProfileDetails {
    ProfileDetails::Student(StudentDetails {
        student_identifier_hash: BytesN::from_array(env, &[hash_val; 32]),
        department: text(env, "Engineering"),
        program: text(env, "Computer Science"),
        graduation_year: 2027,
    })
}

fn merchant_details(env: &Env, category: MerchantCategory) -> ProfileDetails {
    ProfileDetails::Merchant(MerchantDetails {
        business_name: text(env, "Campus Merchant"),
        category,
        business_description: text(env, "Campus goods"),
    })
}

fn organizer_details(env: &Env) -> ProfileDetails {
    ProfileDetails::EventOrganizer(EventOrganizerDetails {
        organization_name: text(env, "Campus Events"),
        organization_description: text(env, "Events for students"),
    })
}

struct Contracts<'a> {
    identity: CampusIdentityClient<'a>,
    token: CampusTokenClient<'a>,
    service: CampusServiceClient<'a>,
    platform_admin: Address,
}

fn deployed(env: &Env) -> Contracts<'_> {
    env.mock_all_auths();
    let platform_admin = Address::generate(env);
    let identity_id = env.register_contract(None, CampusIdentity);
    let identity = CampusIdentityClient::new(env, &identity_id);
    identity.initialize(&platform_admin, &text(env, "Campus Platform"));

    let service_id = env.register_contract(None, CampusService);
    let token_id = env.register_contract(None, CampusToken);
    let token = CampusTokenClient::new(env, &token_id);
    token.initialize(
        &platform_admin,
        &identity_id,
        &service_id,
        &7,
        &text(env, "Campus Token"),
        &text(env, "CAMP"),
    );
    let service = CampusServiceClient::new(env, &service_id);
    service.initialize(
        &platform_admin,
        &token_id,
        &identity_id,
        &Address::generate(env),
    );
    Contracts {
        identity,
        token,
        service,
        platform_admin,
    }
}

fn claim_and_approve(contracts: &Contracts<'_>, env: &Env, university_admin: &Address, code: &str) {
    contracts.identity.register_university(
        university_admin,
        &text(env, code),
        &text(env, "Example University"),
        &text(env, "1 University Avenue"),
        &text(env, "Registrar"),
    );
    contracts
        .identity
        .approve_university(&contracts.platform_admin, &text(env, code));
}

fn register_and_verify(
    contracts: &Contracts<'_>,
    env: &Env,
    university_admin: &Address,
    address: &Address,
    code: &str,
    role: UserRole,
    details: ProfileDetails,
) {
    contracts.identity.register_profile(
        address,
        &text(env, "Campus User"),
        &text(env, code),
        &role,
        &details,
    );
    contracts.identity.verify_profile(university_admin, address);
}

#[test]
fn pending_profiles_are_blocked_from_marketplace_actions() {
    let env = Env::default();
    let contracts = deployed(&env);
    let university_admin = Address::generate(&env);
    let pending_student = Address::generate(&env);
    claim_and_approve(&contracts, &env, &university_admin, "UNI-A");
    contracts.identity.register_profile(
        &pending_student,
        &text(&env, "Pending Student"),
        &text(&env, "UNI-A"),
        &UserRole::Student,
        &student_details(&env, 1),
    );

    assert!(contracts
        .service
        .try_create_listing(
            &pending_student,
            &text(&env, "Pending listing"),
            &text(&env, "Must not be listed"),
            &text(&env, ""),
            &10i128,
            &1u32,
            &false,
        )
        .is_err());
}

#[test]
fn verified_student_and_merchant_can_both_create_marketplace_listings() {
    let env = Env::default();
    let contracts = deployed(&env);
    let university_admin = Address::generate(&env);
    let student = Address::generate(&env);
    let merchant = Address::generate(&env);
    claim_and_approve(&contracts, &env, &university_admin, "UNI-A");
    register_and_verify(
        &contracts,
        &env,
        &university_admin,
        &student,
        "UNI-A",
        UserRole::Student,
        student_details(&env, 1),
    );
    register_and_verify(
        &contracts,
        &env,
        &university_admin,
        &merchant,
        "UNI-A",
        UserRole::Merchant,
        merchant_details(&env, MerchantCategory::Retail),
    );

    let student_listing = contracts.service.create_listing(
        &student,
        &text(&env, "Used textbook"),
        &text(&env, "Personal item"),
        &text(&env, ""),
        &10i128,
        &1u32,
        &false,
    );
    let merchant_listing = contracts.service.create_listing(
        &merchant,
        &text(&env, "New notebook"),
        &text(&env, "Shop inventory"),
        &text(&env, ""),
        &15i128,
        &1u32,
        &false,
    );
    assert_eq!(
        contracts.service.get_listing(&student_listing, &student).seller,
        student
    );
    assert_eq!(
        contracts.service.get_listing(&merchant_listing, &merchant).seller,
        merchant
    );
}

#[test]
fn university_boundaries_block_cross_campus_actions_and_allow_same_campus_actions() {
    let env = Env::default();
    let contracts = deployed(&env);
    let admin_a = Address::generate(&env);
    let admin_b = Address::generate(&env);
    let student_a = Address::generate(&env);
    let student_b = Address::generate(&env);
    let retail_merchant_a = Address::generate(&env);
    let food_merchant_a = Address::generate(&env);
    let organizer_a = Address::generate(&env);
    claim_and_approve(&contracts, &env, &admin_a, "UNI-A");
    claim_and_approve(&contracts, &env, &admin_b, "UNI-B");
    register_and_verify(
        &contracts,
        &env,
        &admin_a,
        &student_a,
        "UNI-A",
        UserRole::Student,
        student_details(&env, 1),
    );
    register_and_verify(
        &contracts,
        &env,
        &admin_b,
        &student_b,
        "UNI-B",
        UserRole::Student,
        student_details(&env, 2),
    );
    register_and_verify(
        &contracts,
        &env,
        &admin_a,
        &retail_merchant_a,
        "UNI-A",
        UserRole::Merchant,
        merchant_details(&env, MerchantCategory::Retail),
    );
    register_and_verify(
        &contracts,
        &env,
        &admin_a,
        &food_merchant_a,
        "UNI-A",
        UserRole::Merchant,
        merchant_details(&env, MerchantCategory::FoodCanteen),
    );
    register_and_verify(
        &contracts,
        &env,
        &admin_a,
        &organizer_a,
        "UNI-A",
        UserRole::EventOrganizer,
        organizer_details(&env),
    );

    let listing_id = contracts.service.create_listing(
        &retail_merchant_a,
        &text(&env, "Calculator"),
        &text(&env, "Campus shop stock"),
        &text(&env, ""),
        &25i128,
        &1u32,
        &false,
    );
    
    // Student B (UNI-B) trying to buy listing from UNI-A fails
    assert!(contracts
        .service
        .try_buy_listing(&listing_id, &student_b)
        .is_err());

    contracts.token.mint(&student_a, &100i128);
    contracts
        .token
        .approve(&student_a, &contracts.service.address, &100i128, &1000u32);
    
    // Cross-university wallet transfer (pay_camp) should SUCCEED
    contracts
        .service
        .pay_camp(&student_a, &student_b, &10i128);
    assert_eq!(contracts.token.balance(&student_b), 10i128);

    // Same university buy listing succeeds
    contracts.service.buy_listing(&listing_id, &student_a);
    assert_eq!(contracts.service.get_listing(&listing_id, &student_a).status, 2);

    let event_id = contracts.service.create_event(&organizer_a, &0i128, &10u32);
    assert!(contracts
        .service
        .try_buy_ticket(&event_id, &student_b)
        .is_err());
    let ticket_id = contracts.service.buy_ticket(&event_id, &student_a);
    assert_eq!(contracts.service.get_ticket(&ticket_id, &student_a).owner, student_a);

    let menu_item_id = contracts.service.publish_menu_item(
        &food_merchant_a,
        &text(&env, "Lunch"),
        &text(&env, "Daily canteen meal"),
        &20i128,
        &true,
    );
    assert!(contracts
        .service
        .try_place_order(&student_b, &menu_item_id, &1u32)
        .is_err());
}

#[test]
fn food_ordering_enforces_ownership_cancellation_and_sequential_transitions() {
    let env = Env::default();
    let contracts = deployed(&env);
    let university_admin = Address::generate(&env);
    let student = Address::generate(&env);
    let food_merchant = Address::generate(&env);
    let other_merchant = Address::generate(&env);
    claim_and_approve(&contracts, &env, &university_admin, "UNI-A");
    register_and_verify(
        &contracts,
        &env,
        &university_admin,
        &student,
        "UNI-A",
        UserRole::Student,
        student_details(&env, 1),
    );
    register_and_verify(
        &contracts,
        &env,
        &university_admin,
        &food_merchant,
        "UNI-A",
        UserRole::Merchant,
        merchant_details(&env, MerchantCategory::FoodCanteen),
    );
    register_and_verify(
        &contracts,
        &env,
        &university_admin,
        &other_merchant,
        "UNI-A",
        UserRole::Merchant,
        merchant_details(&env, MerchantCategory::FoodCanteen),
    );
    contracts.token.mint(&student, &200i128);
    contracts
        .token
        .approve(&student, &contracts.service.address, &200i128, &1000u32);
    let menu_item_id = contracts.service.publish_menu_item(
        &food_merchant,
        &text(&env, "Canteen lunch"),
        &text(&env, "Fresh meal"),
        &20i128,
        &true,
    );

    let cancelled_order = contracts
        .service
        .place_order(&student, &menu_item_id, &1u32);
    contracts.service.cancel_order(&student, &cancelled_order);
    assert_eq!(
        contracts.service.get_food_order(&cancelled_order, &student).status,
        FoodOrderStatus::Cancelled
    );

    let order_id = contracts
        .service
        .place_order(&student, &menu_item_id, &1u32);
    assert!(contracts
        .service
        .try_update_order_status(&food_merchant, &order_id, &FoodOrderStatus::Completed)
        .is_err());
    assert!(contracts
        .service
        .try_update_order_status(&other_merchant, &order_id, &FoodOrderStatus::Preparing)
        .is_err());
    contracts
        .service
        .update_order_status(&food_merchant, &order_id, &FoodOrderStatus::Preparing);
    assert!(contracts
        .service
        .try_cancel_order(&student, &order_id)
        .is_err());
    contracts.service.update_order_status(
        &food_merchant,
        &order_id,
        &FoodOrderStatus::ReadyForPickup,
    );
    contracts
        .service
        .update_order_status(&food_merchant, &order_id, &FoodOrderStatus::Completed);
    assert_eq!(
        contracts.service.get_food_order(&order_id, &student).status,
        FoodOrderStatus::Completed
    );
}

#[test]
fn test_scholarship_flow_and_getters() {
    let env = Env::default();
    let contracts = deployed(&env);
    let admin = Address::generate(&env);
    let student = Address::generate(&env);
    let platform_admin = contracts.platform_admin.clone();

    claim_and_approve(&contracts, &env, &admin, "UNI-A");
    register_and_verify(
        &contracts,
        &env,
        &admin,
        &student,
        "UNI-A",
        UserRole::Student,
        student_details(&env, 1),
    );

    // Mint and approve tokens from platform_admin to service contract
    let amount = 2000i128;
    contracts.token.mint(&platform_admin, &amount);
    contracts.token.approve(&platform_admin, &contracts.service.address, &amount, &10000u32);

    // Create scholarship
    let scholarship_id = contracts.service.create_scholarship(
        &admin,
        &text(&env, "Science Scholarship"),
        &text(&env, "Science Department Funding"),
        &text(&env, "GPA >= 3.5"),
        &1000i128,
        &text(&env, "2026-12-31"),
        &2u32,
    );

    // Get and list scholarships
    let scholarship = contracts.service.get_scholarship(&scholarship_id, &admin);
    assert_eq!(scholarship.id, scholarship_id);
    assert_eq!(scholarship.title, text(&env, "Science Scholarship"));
    assert_eq!(scholarship.amount, 1000i128);
    assert_eq!(scholarship.created_by, admin);
    assert_eq!(scholarship.slots, 2);
    assert_eq!(scholarship.admin_approval_status, ApprovalStatus::Pending);

    // Approve the scholarship as platform admin
    contracts.service.admin_approve_scholarship(&platform_admin, &scholarship_id);
    let scholarship = contracts.service.get_scholarship(&scholarship_id, &admin);
    assert_eq!(scholarship.admin_approval_status, ApprovalStatus::Approved);

    // Apply for scholarship
    let app_id = contracts.service.apply_scholarship(&student, &scholarship_id);

    // Get and list applications
    let app = contracts.service.get_scholarship_application(&app_id, &admin);
    assert_eq!(app.id, app_id);
    assert_eq!(app.scholarship_id, scholarship_id);
    assert_eq!(app.student, student);
    assert_eq!(app.status, ApprovalStatus::Pending);

    let apps = contracts.service.get_scholarship_applications(&admin);
    assert_eq!(apps.len(), 1);
    assert_eq!(apps.get(0).unwrap().id, app_id);

    // Decide application (approve)
    contracts.service.decide_application(&admin, &app_id, &true);

    // Verify application status and slot decrement
    let app = contracts.service.get_scholarship_application(&app_id, &student);
    assert_eq!(app.status, ApprovalStatus::Approved);

    let scholarship = contracts.service.get_scholarship(&scholarship_id, &student);
    assert_eq!(scholarship.slots, 1);

    // Verify that the student received the scholarship amount
    let balance = contracts.token.balance(&student);
    assert_eq!(balance, 1000i128);
}

#[test]
fn test_cross_university_reads_fail() {
    let env = Env::default();
    let contracts = deployed(&env);
    let admin_a = Address::generate(&env);
    let admin_b = Address::generate(&env);
    let student_a = Address::generate(&env);
    let student_b = Address::generate(&env);

    claim_and_approve(&contracts, &env, &admin_a, "UNI-A");
    claim_and_approve(&contracts, &env, &admin_b, "UNI-B");

    register_and_verify(
        &contracts,
        &env,
        &admin_a,
        &student_a,
        "UNI-A",
        UserRole::Student,
        student_details(&env, 1),
    );
    register_and_verify(
        &contracts,
        &env,
        &admin_b,
        &student_b,
        "UNI-B",
        UserRole::Student,
        student_details(&env, 2),
    );

    // Create a listing in University A
    let listing_id = contracts.service.create_listing(
        &student_a,
        &text(&env, "Book"),
        &text(&env, "Desc"),
        &text(&env, ""),
        &100i128,
        &1u32,
        &false,
    );

    // Student A can read listing
    assert!(contracts.service.try_get_listing(&listing_id, &student_a).is_ok());

    // Student B (UNI-B) trying to read UNI-A listing fails on-chain
    assert!(contracts.service.try_get_listing(&listing_id, &student_b).is_err());
}

#[test]
fn test_platform_admin_reads_bypass_isolation() {
    let env = Env::default();
    let contracts = deployed(&env);
    let admin_a = Address::generate(&env);
    let student_a = Address::generate(&env);

    claim_and_approve(&contracts, &env, &admin_a, "UNI-A");
    register_and_verify(
        &contracts,
        &env,
        &admin_a,
        &student_a,
        "UNI-A",
        UserRole::Student,
        student_details(&env, 1),
    );

    let listing_id = contracts.service.create_listing(
        &student_a,
        &text(&env, "Book"),
        &text(&env, "Desc"),
        &text(&env, ""),
        &100i128,
        &1u32,
        &false,
    );

    // Platform admin (who has no university_code) can successfully read
    assert!(contracts.service.try_get_listing(&listing_id, &contracts.platform_admin).is_ok());
}

#[test]
fn test_faucet_claim_once() {
    let env = Env::default();
    let contracts = deployed(&env);
    let admin_a = Address::generate(&env);
    let student_a = Address::generate(&env);

    claim_and_approve(&contracts, &env, &admin_a, "UNI-A");
    register_and_verify(
        &contracts,
        &env,
        &admin_a,
        &student_a,
        "UNI-A",
        UserRole::Student,
        student_details(&env, 1),
    );

    // Initial has_claimed_faucet is false
    assert!(!contracts.service.has_claimed_faucet(&student_a));

    // Claim faucet succeeds
    assert!(contracts.service.try_claim_faucet(&student_a).is_ok());

    // has_claimed_faucet is now true
    assert!(contracts.service.has_claimed_faucet(&student_a));

    // Claiming again fails
    assert!(contracts.service.try_claim_faucet(&student_a).is_err());
}
