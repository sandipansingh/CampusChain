#[cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_initialize_and_register_profile() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let student = Address::generate(&env);

    let identity_id = env.register_contract(None, CampusIdentity);
    let identity_client = CampusIdentityClient::new(&env, &identity_id);

    let admin_name = String::from_str(&env, "Admin User");
    let admin_dept = String::from_str(&env, "Administration");
    identity_client.initialize(&admin, &admin_name, &123u64, &admin_dept);

    // Verify admin profile was created successfully
    let admin_profile = identity_client.get_profile(&admin);
    assert_eq!(admin_profile.full_name, admin_name);
    assert_eq!(admin_profile.university_id, 123u64);
    assert_eq!(admin_profile.role, UserRole::Admin);
    assert_eq!(admin_profile.verified, true);

    // Register a student profile
    let student_name = String::from_str(&env, "Alice Smith");
    let student_dept = String::from_str(&env, "Computer Science");
    identity_client.register_profile(&student, &student_name, &456u64, &student_dept);

    let student_profile = identity_client.get_profile(&student);
    assert_eq!(student_profile.full_name, student_name);
    assert_eq!(student_profile.university_id, 456u64);
    assert_eq!(student_profile.role, UserRole::Student);
    assert_eq!(student_profile.verified, false);
}

#[test]
fn test_update_profile() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let student = Address::generate(&env);

    let identity_id = env.register_contract(None, CampusIdentity);
    let identity_client = CampusIdentityClient::new(&env, &identity_id);

    let admin_name = String::from_str(&env, "Admin User");
    let admin_dept = String::from_str(&env, "Administration");
    identity_client.initialize(&admin, &admin_name, &123u64, &admin_dept);

    let student_name = String::from_str(&env, "Alice Smith");
    let student_dept = String::from_str(&env, "Computer Science");
    identity_client.register_profile(&student, &student_name, &456u64, &student_dept);

    // Update profile
    let new_name = String::from_str(&env, "Alice J. Smith");
    let new_dept = String::from_str(&env, "Software Engineering");
    identity_client.update_profile(&student, &new_name, &789u64, &new_dept);

    let updated_profile = identity_client.get_profile(&student);
    assert_eq!(updated_profile.full_name, new_name);
    assert_eq!(updated_profile.university_id, 789u64);
    assert_eq!(updated_profile.department, new_dept);
}

#[test]
fn test_admin_set_role_and_verify() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let merchant = Address::generate(&env);

    let identity_id = env.register_contract(None, CampusIdentity);
    let identity_client = CampusIdentityClient::new(&env, &identity_id);

    let admin_name = String::from_str(&env, "Admin User");
    let admin_dept = String::from_str(&env, "Administration");
    identity_client.initialize(&admin, &admin_name, &123u64, &admin_dept);

    // Register merchant profile (initially defaults to Student)
    let merchant_name = String::from_str(&env, "Campus Bookstore");
    let merchant_dept = String::from_str(&env, "Retail");
    identity_client.register_profile(&merchant, &merchant_name, &999u64, &merchant_dept);

    // Promote to Merchant
    identity_client.set_role(&admin, &merchant, &UserRole::Merchant);
    // Verify to True
    identity_client.set_verified(&admin, &merchant, &true);

    let merchant_profile = identity_client.get_profile(&merchant);
    assert_eq!(merchant_profile.role, UserRole::Merchant);
    assert_eq!(merchant_profile.verified, true);
}

#[test]
#[should_panic(expected = "HostError: Error(Contract, #3)")]
fn test_set_role_unauthorized() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let hacker = Address::generate(&env);
    let target = Address::generate(&env);

    let identity_id = env.register_contract(None, CampusIdentity);
    let identity_client = CampusIdentityClient::new(&env, &identity_id);

    let admin_name = String::from_str(&env, "Admin User");
    let admin_dept = String::from_str(&env, "Administration");
    identity_client.initialize(&admin, &admin_name, &123u64, &admin_dept);

    // Register hacker and target profiles
    let name = String::from_str(&env, "Name");
    let dept = String::from_str(&env, "Dept");
    identity_client.register_profile(&hacker, &name, &111u64, &dept);
    identity_client.register_profile(&target, &name, &222u64, &dept);

    // Hacker tries to promote target to Admin (should panic due to unauthorized role assignment check)
    identity_client.set_role(&hacker, &target, &UserRole::Admin);
}

#[test]
#[should_panic(expected = "HostError: Error(Contract, #6)")]
fn test_register_profile_invalid_input() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let student = Address::generate(&env);

    let identity_id = env.register_contract(None, CampusIdentity);
    let identity_client = CampusIdentityClient::new(&env, &identity_id);

    let admin_name = String::from_str(&env, "Admin User");
    let admin_dept = String::from_str(&env, "Administration");
    identity_client.initialize(&admin, &admin_name, &123u64, &admin_dept);

    // Invalid input: empty name
    let empty_name = String::from_str(&env, "");
    let dept = String::from_str(&env, "Science");
    identity_client.register_profile(&student, &empty_name, &456u64, &dept);
}
