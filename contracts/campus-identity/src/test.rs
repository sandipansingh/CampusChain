use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env, String};

fn text(env: &Env, value: &str) -> String {
    String::from_str(env, value)
}

fn student_details(env: &Env) -> ProfileDetails {
    ProfileDetails::Student(StudentDetails {
        student_identifier_hash: BytesN::from_array(env, &[1; 32]),
        department: text(env, "Engineering"),
        program: text(env, "Computer Science"),
        graduation_year: 2027,
    })
}

fn merchant_details(env: &Env) -> ProfileDetails {
    ProfileDetails::Merchant(MerchantDetails {
        business_name: text(env, "Campus Store"),
        category: MerchantCategory::Retail,
        business_description: text(env, "Books and supplies"),
    })
}

fn organizer_details(env: &Env) -> ProfileDetails {
    ProfileDetails::EventOrganizer(EventOrganizerDetails {
        organization_name: text(env, "Student Council"),
        organization_description: text(env, "Campus events"),
    })
}

fn initialized_identity(env: &Env) -> (CampusIdentityClient<'_>, Address) {
    env.mock_all_auths();
    let platform_admin = Address::generate(env);
    let contract_id = env.register_contract(None, CampusIdentity);
    let client = CampusIdentityClient::new(env, &contract_id);
    client.initialize(&platform_admin, &text(env, "Campus Platform"));
    (client, platform_admin)
}

fn claim_university(client: &CampusIdentityClient<'_>, env: &Env, admin: &Address, code: &str) {
    client.register_university(
        admin,
        &text(env, code),
        &text(env, "Example University"),
        &text(env, "1 University Avenue"),
        &text(env, "Registrar"),
    );
}

#[test]
fn university_codes_are_reserved_while_pending() {
    let env = Env::default();
    let (client, _) = initialized_identity(&env);
    let first_admin = Address::generate(&env);
    let second_admin = Address::generate(&env);

    claim_university(&client, &env, &first_admin, "UNI-A");
    assert_eq!(
        client.get_university(&text(&env, "UNI-A")).approval_status,
        UniversityApprovalStatus::PendingApproval
    );
    assert!(client
        .try_register_university(
            &second_admin,
            &text(&env, "UNI-A"),
            &text(&env, "Duplicate University"),
            &text(&env, "2 University Avenue"),
            &text(&env, "Registrar"),
        )
        .is_err());
}

#[test]
fn only_platform_admin_can_approve_or_reject_universities() {
    let env = Env::default();
    let (client, platform_admin) = initialized_identity(&env);
    let university_admin = Address::generate(&env);
    let stranger = Address::generate(&env);
    claim_university(&client, &env, &university_admin, "UNI-A");

    assert!(client
        .try_approve_university(&university_admin, &text(&env, "UNI-A"))
        .is_err());
    assert!(client
        .try_approve_university(&stranger, &text(&env, "UNI-A"))
        .is_err());
    client.approve_university(&platform_admin, &text(&env, "UNI-A"));
    assert_eq!(
        client.get_university(&text(&env, "UNI-A")).approval_status,
        UniversityApprovalStatus::Approved
    );

    let rejected_admin = Address::generate(&env);
    claim_university(&client, &env, &rejected_admin, "UNI-B");
    assert!(client
        .try_reject_university(&rejected_admin, &text(&env, "UNI-B"))
        .is_err());
    client.reject_university(&platform_admin, &text(&env, "UNI-B"));
    assert_eq!(
        client.get_university(&text(&env, "UNI-B")).approval_status,
        UniversityApprovalStatus::Rejected
    );
}

#[test]
fn scoped_profiles_require_an_approved_university_and_start_pending() {
    let env = Env::default();
    let (client, platform_admin) = initialized_identity(&env);
    let university_admin = Address::generate(&env);
    let student = Address::generate(&env);
    let pending_merchant = Address::generate(&env);
    let pending_organizer = Address::generate(&env);
    let merchant = Address::generate(&env);
    let organizer = Address::generate(&env);
    let unknown = Address::generate(&env);
    claim_university(&client, &env, &university_admin, "UNI-A");

    assert!(client
        .try_register_profile(
            &student,
            &text(&env, "Pending Student"),
            &text(&env, "UNI-A"),
            &UserRole::Student,
            &student_details(&env),
        )
        .is_err());
    assert!(client
        .try_register_profile(
            &pending_merchant,
            &text(&env, "Pending Merchant"),
            &text(&env, "UNI-A"),
            &UserRole::Merchant,
            &merchant_details(&env),
        )
        .is_err());
    assert!(client
        .try_register_profile(
            &pending_organizer,
            &text(&env, "Pending Organizer"),
            &text(&env, "UNI-A"),
            &UserRole::EventOrganizer,
            &organizer_details(&env),
        )
        .is_err());
    assert!(client
        .try_register_profile(
            &unknown,
            &text(&env, "Unknown University Student"),
            &text(&env, "MISSING"),
            &UserRole::Student,
            &student_details(&env),
        )
        .is_err());

    client.approve_university(&platform_admin, &text(&env, "UNI-A"));
    client.register_profile(
        &student,
        &text(&env, "Student"),
        &text(&env, "UNI-A"),
        &UserRole::Student,
        &student_details(&env),
    );
    client.register_profile(
        &merchant,
        &text(&env, "Merchant"),
        &text(&env, "UNI-A"),
        &UserRole::Merchant,
        &merchant_details(&env),
    );
    client.register_profile(
        &organizer,
        &text(&env, "Organizer"),
        &text(&env, "UNI-A"),
        &UserRole::EventOrganizer,
        &organizer_details(&env),
    );
    for address in [&student, &merchant, &organizer] {
        assert_eq!(
            client.get_profile(address).verification_status,
            VerificationStatus::Pending
        );
    }
}

#[test]
fn only_matching_university_admin_can_verify_or_reject_profiles() {
    let env = Env::default();
    let (client, platform_admin) = initialized_identity(&env);
    let admin_a = Address::generate(&env);
    let admin_b = Address::generate(&env);
    let student_a = Address::generate(&env);
    let student_for_rejection = Address::generate(&env);
    let non_admin = Address::generate(&env);
    claim_university(&client, &env, &admin_a, "UNI-A");
    claim_university(&client, &env, &admin_b, "UNI-B");
    client.approve_university(&platform_admin, &text(&env, "UNI-A"));
    client.approve_university(&platform_admin, &text(&env, "UNI-B"));
    client.register_profile(
        &student_a,
        &text(&env, "Student A"),
        &text(&env, "UNI-A"),
        &UserRole::Student,
        &student_details(&env),
    );
    client.register_profile(
        &student_for_rejection,
        &text(&env, "Student To Reject"),
        &text(&env, "UNI-A"),
        &UserRole::Student,
        &student_details(&env),
    );

    assert!(client.try_verify_profile(&admin_b, &student_a).is_err());
    assert!(client.try_verify_profile(&non_admin, &student_a).is_err());
    client.verify_profile(&admin_a, &student_a);
    assert_eq!(
        client.get_profile(&student_a).verification_status,
        VerificationStatus::Verified
    );

    assert!(client
        .try_reject_profile(&admin_b, &student_for_rejection)
        .is_err());
    client.reject_profile(&admin_a, &student_for_rejection);
    assert_eq!(
        client
            .get_profile(&student_for_rejection)
            .verification_status,
        VerificationStatus::Rejected
    );
}

#[test]
fn platform_admin_is_bootstrapped_once_and_cannot_be_assigned() {
    let env = Env::default();
    let (client, platform_admin) = initialized_identity(&env);
    let other_address = Address::generate(&env);

    let profile = client.get_profile(&platform_admin);
    assert_eq!(profile.role, UserRole::PlatformAdmin);
    assert_eq!(profile.verification_status, VerificationStatus::Verified);
    assert!(profile.university_code.is_none());

    assert!(client
        .try_register_profile(
            &other_address,
            &text(&env, "Impostor"),
            &text(&env, "UNI-A"),
            &UserRole::PlatformAdmin,
            &ProfileDetails::PlatformAdmin,
        )
        .is_err());
    assert!(client
        .try_register_university(
            &platform_admin,
            &text(&env, "UNI-A"),
            &text(&env, "Not Allowed"),
            &text(&env, "1 Avenue"),
            &text(&env, "Registrar"),
        )
        .is_err());
}
