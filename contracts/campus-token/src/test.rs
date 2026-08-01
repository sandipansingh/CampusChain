#![cfg(test)]

use super::*;
use campus_identity::{
    CampusIdentity, CampusIdentityClient, ProfileDetails, StudentDetails, UserRole,
};
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env, String};

fn text(env: &Env, value: &str) -> String {
    String::from_str(env, value)
}

fn student_details(env: &Env, hash_val: u8) -> ProfileDetails {
    ProfileDetails::Student(StudentDetails {
        student_id: text(env, "NIT/2025/0433"),
        student_identifier_hash: BytesN::from_array(env, &[hash_val; 32]),
        department: text(env, "Engineering"),
        program: text(env, "Computer Science"),
        graduation_year: 2027,
    })
}

struct TestContext<'a> {
    identity: CampusIdentityClient<'a>,
    token: CampusTokenClient<'a>,
    platform_admin: Address,
    service: Address,
}

fn setup_test_context(env: &Env) -> TestContext<'_> {
    env.mock_all_auths();
    let platform_admin = Address::generate(env);
    let service = Address::generate(env);

    // Register and initialize Identity
    let identity_id = env.register_contract(None, CampusIdentity);
    let identity = CampusIdentityClient::new(env, &identity_id);
    identity.initialize(&platform_admin, &text(env, "Campus Platform"));

    // Register and initialize Token
    let token_id = env.register_contract(None, CampusToken);
    let token = CampusTokenClient::new(env, &token_id);
    token.initialize(
        &platform_admin,
        &identity_id,
        &service,
        &7u32,
        &text(env, "CampusToken"),
        &text(env, "CAMP"),
    );

    TestContext {
        identity,
        token,
        platform_admin,
        service,
    }
}

fn onboard_student(
    ctx: &TestContext<'_>,
    env: &Env,
    student: &Address,
    univ_admin: &Address,
    code: &str,
    hash_val: u8,
) {
    // Register university if not already
    let univ_code = text(env, code);
    if ctx.identity.try_get_university(&univ_code).is_err() {
        ctx.identity.register_university(
            univ_admin,
            &univ_code,
            &text(env, "Test University"),
            &text(env, "123 Campus Rd"),
            &text(env, "Registrar"),
        );
        ctx.identity.approve_university(&ctx.platform_admin, &univ_code);
    }

    // Register and verify student
    ctx.identity.register_profile(
        student,
        &text(env, "Test Student"),
        &univ_code,
        &UserRole::Student,
        &student_details(env, hash_val),
    );
    ctx.identity.verify_profile(univ_admin, student);
}

#[test]
fn test_initialize_and_metadata() {
    let env = Env::default();
    let ctx = setup_test_context(&env);

    assert_eq!(ctx.token.platform_admin(), ctx.platform_admin);
    assert_eq!(ctx.token.name(), text(&env, "CampusToken"));
    assert_eq!(ctx.token.symbol(), text(&env, "CAMP"));
    assert_eq!(ctx.token.decimals(), 7u32);
    assert_eq!(ctx.token.total_supply(), 0i128);
}

#[test]
fn test_mint_burn_faucet() {
    let env = Env::default();
    let ctx = setup_test_context(&env);
    let univ_admin = Address::generate(&env);
    let student = Address::generate(&env);

    onboard_student(&ctx, &env, &student, &univ_admin, "UNI-A", 1);

    // Faucet claim
    ctx.token.faucet(&student);
    assert_eq!(ctx.token.balance(&student), 100_000_0000i128);
    assert_eq!(ctx.token.total_supply(), 100_000_0000i128);

    // Faucet can only be claimed once
    assert!(ctx.token.try_faucet(&student).is_err());

    // Mint by platform admin
    ctx.token.mint(&student, &50_000_0000i128);
    assert_eq!(ctx.token.balance(&student), 150_000_0000i128);

    // Burn
    ctx.token.burn(&student, &30_000_0000i128);
    assert_eq!(ctx.token.balance(&student), 120_000_0000i128);
}

#[test]
fn test_transfer_and_allowances() {
    let env = Env::default();
    let ctx = setup_test_context(&env);
    let admin_a = Address::generate(&env);
    let student_a = Address::generate(&env);
    let admin_b = Address::generate(&env);
    let student_b = Address::generate(&env);
    let spender = Address::generate(&env);

    onboard_student(&ctx, &env, &student_a, &admin_a, "UNI-A", 1);
    onboard_student(&ctx, &env, &student_b, &admin_b, "UNI-B", 2);

    ctx.token.mint(&student_a, &1000i128);

    // Direct Transfer (cross-university peer-to-peer should succeed!)
    ctx.token.transfer(&student_a, &student_b, &300i128);
    assert_eq!(ctx.token.balance(&student_a), 700i128);
    assert_eq!(ctx.token.balance(&student_b), 300i128);

    // Spender flow
    // Spender must also be an active profile (in some role, let's onboard spender as a student at UNI-A)
    onboard_student(&ctx, &env, &spender, &admin_a, "UNI-A", 3);

    ctx.token.approve(&student_a, &spender, &200i128, &1000u32);
    assert_eq!(ctx.token.allowance(&student_a, &spender), 200i128);

    ctx.token.transfer_from(&spender, &student_a, &student_b, &150i128);
    assert_eq!(ctx.token.balance(&student_a), 550i128);
    assert_eq!(ctx.token.balance(&student_b), 450i128);
    assert_eq!(ctx.token.allowance(&student_a, &spender), 50i128);
}

#[test]
fn test_unverified_transfer_fails() {
    let env = Env::default();
    let ctx = setup_test_context(&env);
    let admin_a = Address::generate(&env);
    let student_a = Address::generate(&env);
    let unverified_student = Address::generate(&env);

    onboard_student(&ctx, &env, &student_a, &admin_a, "UNI-A", 1);

    // Unverified student tries to register profile but doesn't get verified
    ctx.identity.register_profile(
        &unverified_student,
        &text(&env, "Unverified Student"),
        &text(&env, "UNI-A"),
        &UserRole::Student,
        &student_details(&env, 2),
    );

    ctx.token.mint(&student_a, &1000i128);

    // Transfer to unverified should fail
    assert!(ctx.token.try_transfer(&student_a, &unverified_student, &100i128).is_err());
}
