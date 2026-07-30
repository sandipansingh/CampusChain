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
    let admin_uni_id = String::from_str(&env, "123");
    identity_client.initialize(&admin, &admin_name, &admin_uni_id, &admin_dept);

    // Verify admin profile was created successfully
    let admin_profile = identity_client.get_profile(&admin);
    assert_eq!(admin_profile.full_name, admin_name);
    assert_eq!(admin_profile.university_id, admin_uni_id);
    assert_eq!(admin_profile.role, UserRole::Admin);
    assert_eq!(admin_profile.verified, true);

    // Register a student profile
    let student_name = String::from_str(&env, "Alice Smith");
    let student_dept = String::from_str(&env, "Computer Science");
    let student_uni_id = String::from_str(&env, "456");
    identity_client.register_profile(&student, &student_name, &student_uni_id, &student_dept);

    let student_profile = identity_client.get_profile(&student);
    assert_eq!(student_profile.full_name, student_name);
    assert_eq!(student_profile.university_id, student_uni_id);
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
    let admin_uni_id = String::from_str(&env, "123");
    identity_client.initialize(&admin, &admin_name, &admin_uni_id, &admin_dept);

    let student_name = String::from_str(&env, "Alice Smith");
    let student_dept = String::from_str(&env, "Computer Science");
    let student_uni_id = String::from_str(&env, "456");
    identity_client.register_profile(&student, &student_name, &student_uni_id, &student_dept);

    // Update profile
    let new_name = String::from_str(&env, "Alice J. Smith");
    let new_dept = String::from_str(&env, "Software Engineering");
    let new_uni_id = String::from_str(&env, "789");
    identity_client.update_profile(&student, &new_name, &new_uni_id, &new_dept);

    let updated_profile = identity_client.get_profile(&student);
    assert_eq!(updated_profile.full_name, new_name);
    assert_eq!(updated_profile.university_id, new_uni_id);
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
    let admin_uni_id = String::from_str(&env, "123");
    identity_client.initialize(&admin, &admin_name, &admin_uni_id, &admin_dept);

    // Register merchant profile (initially defaults to Student)
    let merchant_name = String::from_str(&env, "Campus Bookstore");
    let merchant_dept = String::from_str(&env, "Retail");
    let merchant_uni_id = String::from_str(&env, "999");
    identity_client.register_profile(&merchant, &merchant_name, &merchant_uni_id, &merchant_dept);

    // Promote to Merchant
    identity_client.set_role_value(&admin, &merchant, &2);
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
    let admin_uni_id = String::from_str(&env, "123");
    identity_client.initialize(&admin, &admin_name, &admin_uni_id, &admin_dept);

    // Register hacker and target profiles
    let name = String::from_str(&env, "Name");
    let dept = String::from_str(&env, "Dept");
    let hacker_uni_id = String::from_str(&env, "111");
    let target_uni_id = String::from_str(&env, "222");
    identity_client.register_profile(&hacker, &name, &hacker_uni_id, &dept);
    identity_client.register_profile(&target, &name, &target_uni_id, &dept);

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
    let admin_uni_id = String::from_str(&env, "123");
    identity_client.initialize(&admin, &admin_name, &admin_uni_id, &admin_dept);

    // Invalid input: empty name
    let empty_name = String::from_str(&env, "");
    let dept = String::from_str(&env, "Science");
    let student_uni_id = String::from_str(&env, "456");
    identity_client.register_profile(&student, &empty_name, &student_uni_id, &dept);
}
