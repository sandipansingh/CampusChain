#![no_std]

//! CampusIdentity is the single authority for CampusChain identities and universities.
//! Roles and university codes are intentionally write-once. In particular there is no
//! upgrade or role-assignment entry point: the sole Platform Admin must remain immutable.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, BytesN, Env, String, Symbol, Vec,
};

#[cfg(test)]
mod test;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    ProfileNotFound = 4,
    ProfileAlreadyExists = 5,
    UniversityNotFound = 6,
    UniversityAlreadyExists = 7,
    UniversityAdminAlreadyAssigned = 8,
    UniversityNotApproved = 9,
    InvalidInput = 10,
    InvalidRole = 11,
    InvalidVerificationStatus = 12,
    InvalidUniversityStatus = 13,
    UniversityCodeMismatch = 14,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum UserRole {
    Student = 1,
    Merchant = 2,
    EventOrganizer = 3,
    UniversityAdmin = 4,
    PlatformAdmin = 5,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum VerificationStatus {
    Pending = 1,
    Verified = 2,
    Rejected = 3,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum UniversityApprovalStatus {
    PendingApproval = 1,
    Approved = 2,
    Rejected = 3,
    Suspended = 4,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum MerchantCategory {
    Retail = 1,
    FoodCanteen = 2,
    Services = 3,
    Other = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StudentDetails {
    pub student_identifier_hash: BytesN<32>,
    pub department: String,
    pub program: String,
    pub graduation_year: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MerchantDetails {
    pub business_name: String,
    pub category: MerchantCategory,
    pub business_description: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EventOrganizerDetails {
    pub organization_name: String,
    pub organization_description: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UniversityAdminDetails {
    pub title: String,
    pub owned_university_code: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ProfileDetails {
    Student(StudentDetails),
    Merchant(MerchantDetails),
    EventOrganizer(EventOrganizerDetails),
    UniversityAdmin(UniversityAdminDetails),
    PlatformAdmin,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Profile {
    pub address: Address,
    pub full_name: String,
    pub university_code: Option<String>,
    pub role: UserRole,
    pub verification_status: VerificationStatus,
    pub details: ProfileDetails,
    pub created_at: u64,
    pub updated_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct University {
    pub code: String,
    pub name: String,
    /// Physical/postal address, not a Stellar account address.
    pub address: String,
    pub admin_address: Address,
    pub approval_status: UniversityApprovalStatus,
    pub created_at: u64,
    pub updated_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    PlatformAdmin,
    Profile(Address),
    UniversityByCode(String),
    UniversityCodeByAdmin(Address),
}

const LEDGER_THRESHOLD_INSTANCE: u32 = 1_000;
const LEDGER_EXTEND_TO_INSTANCE: u32 = 10_000;
const LEDGER_THRESHOLD_PERSISTENT: u32 = 1_000;
const LEDGER_EXTEND_TO_PERSISTENT: u32 = 10_000;
const MAX_UNIVERSITY_CODE_LEN: u32 = 32;

fn extend_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(LEDGER_THRESHOLD_INSTANCE, LEDGER_EXTEND_TO_INSTANCE);
}

fn extend_persistent(env: &Env, key: &DataKey) {
    if env.storage().persistent().has(key) {
        env.storage().persistent().extend_ttl(
            key,
            LEDGER_THRESHOLD_PERSISTENT,
            LEDGER_EXTEND_TO_PERSISTENT,
        );
    }
}

fn get_platform_admin(env: &Env) -> Result<Address, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::PlatformAdmin)
        .ok_or(Error::NotInitialized)
}

fn require_platform_admin(env: &Env, caller: &Address) -> Result<(), Error> {
    caller.require_auth();
    if get_platform_admin(env)? != *caller {
        return Err(Error::Unauthorized);
    }
    Ok(())
}

fn validate_code(code: &String) -> Result<(), Error> {
    // The deployment/UI boundary must uppercase-normalize codes. The contract also
    // bounds the stored key so hostile inputs cannot create unbounded storage keys.
    if code.len() < 2 || code.len() > MAX_UNIVERSITY_CODE_LEN {
        return Err(Error::InvalidInput);
    }
    Ok(())
}

fn get_profile_internal(env: &Env, address: &Address) -> Result<Profile, Error> {
    let key = DataKey::Profile(address.clone());
    extend_persistent(env, &key);
    env.storage()
        .persistent()
        .get(&key)
        .ok_or(Error::ProfileNotFound)
}

fn get_university_internal(env: &Env, code: &String) -> Result<University, Error> {
    let key = DataKey::UniversityByCode(code.clone());
    extend_persistent(env, &key);
    env.storage()
        .persistent()
        .get(&key)
        .ok_or(Error::UniversityNotFound)
}

fn profile_code(profile: &Profile) -> Result<String, Error> {
    profile
        .university_code
        .clone()
        .ok_or(Error::UniversityCodeMismatch)
}

fn details_match_role(role: UserRole, details: &ProfileDetails) -> bool {
    matches!(
        (role, details),
        (UserRole::Student, ProfileDetails::Student(_))
            | (UserRole::Merchant, ProfileDetails::Merchant(_))
            | (UserRole::EventOrganizer, ProfileDetails::EventOrganizer(_))
            | (
                UserRole::UniversityAdmin,
                ProfileDetails::UniversityAdmin(_)
            )
            | (UserRole::PlatformAdmin, ProfileDetails::PlatformAdmin)
    )
}

fn assert_active_profile_internal(env: &Env, address: &Address) -> Result<Profile, Error> {
    let profile = get_profile_internal(env, address)?;
    if profile.role == UserRole::PlatformAdmin {
        if profile.address == get_platform_admin(env)?
            && profile.verification_status == VerificationStatus::Verified
            && profile.university_code.is_none()
        {
            return Ok(profile);
        }
        return Err(Error::Unauthorized);
    }
    if profile.verification_status != VerificationStatus::Verified {
        return Err(Error::Unauthorized);
    }
    let code = profile_code(&profile)?;
    if get_university_internal(env, &code)?.approval_status != UniversityApprovalStatus::Approved {
        return Err(Error::UniversityNotApproved);
    }
    Ok(profile)
}

fn assert_active_university_admin_internal(
    env: &Env,
    address: &Address,
    university_code: &String,
) -> Result<Profile, Error> {
    let profile = assert_active_profile_internal(env, address)?;
    if profile.role != UserRole::UniversityAdmin || profile_code(&profile)? != *university_code {
        return Err(Error::Unauthorized);
    }
    match profile.details {
        ProfileDetails::UniversityAdmin(UniversityAdminDetails {
            ref owned_university_code,
            ..
        }) if *owned_university_code == *university_code => {}
        _ => return Err(Error::Unauthorized),
    }
    let university = get_university_internal(env, university_code)?;
    if university.admin_address != *address {
        return Err(Error::Unauthorized);
    }
    Ok(profile)
}

#[contract]
pub struct CampusIdentity;

#[contractimpl]
impl CampusIdentity {
    /// Initializes the immutable Platform Admin and its sole, non-university profile.
    pub fn initialize(env: Env, platform_admin: Address, full_name: String) -> Result<(), Error> {
        let admin_key = DataKey::PlatformAdmin;
        if env.storage().persistent().has(&admin_key) {
            return Err(Error::AlreadyInitialized);
        }
        platform_admin.require_auth();
        if full_name.len() == 0 {
            return Err(Error::InvalidInput);
        }

        env.storage().persistent().set(&admin_key, &platform_admin);
        let profile_key = DataKey::Profile(platform_admin.clone());
        let now = env.ledger().timestamp();
        env.storage().persistent().set(
            &profile_key,
            &Profile {
                address: platform_admin.clone(),
                full_name,
                university_code: None,
                role: UserRole::PlatformAdmin,
                verification_status: VerificationStatus::Verified,
                details: ProfileDetails::PlatformAdmin,
                created_at: now,
                updated_at: now,
            },
        );
        extend_persistent(&env, &admin_key);
        extend_persistent(&env, &profile_key);
        extend_instance(&env);
        Ok(())
    }

    pub fn platform_admin(env: Env) -> Result<Address, Error> {
        extend_instance(&env);
        get_platform_admin(&env)
    }

    /// Claims a code atomically with a University Admin profile. Codes stay reserved
    /// after rejection, so there is no second claim path.
    pub fn register_university(
        env: Env,
        admin: Address,
        code: String,
        name: String,
        address: String,
        title: String,
    ) -> Result<(), Error> {
        admin.require_auth();
        if admin == get_platform_admin(&env)? {
            return Err(Error::Unauthorized);
        }
        validate_code(&code)?;
        if name.len() == 0 || address.len() == 0 || title.len() == 0 {
            return Err(Error::InvalidInput);
        }
        let profile_key = DataKey::Profile(admin.clone());
        let university_key = DataKey::UniversityByCode(code.clone());
        let owner_key = DataKey::UniversityCodeByAdmin(admin.clone());
        if env.storage().persistent().has(&profile_key) {
            return Err(Error::ProfileAlreadyExists);
        }
        if env.storage().persistent().has(&university_key) {
            return Err(Error::UniversityAlreadyExists);
        }
        if env.storage().persistent().has(&owner_key) {
            return Err(Error::UniversityAdminAlreadyAssigned);
        }

        let now = env.ledger().timestamp();
        let profile = Profile {
            address: admin.clone(),
            full_name: name.clone(),
            university_code: Some(code.clone()),
            role: UserRole::UniversityAdmin,
            // The university state is the activation gate for its administrator.
            verification_status: VerificationStatus::Verified,
            details: ProfileDetails::UniversityAdmin(UniversityAdminDetails {
                title,
                owned_university_code: code.clone(),
            }),
            created_at: now,
            updated_at: now,
        };
        let university = University {
            code: code.clone(),
            name,
            address,
            admin_address: admin.clone(),
            approval_status: UniversityApprovalStatus::PendingApproval,
            created_at: now,
            updated_at: now,
        };
        env.storage().persistent().set(&profile_key, &profile);
        env.storage().persistent().set(&university_key, &university);
        env.storage().persistent().set(&owner_key, &code);
        extend_persistent(&env, &profile_key);
        extend_persistent(&env, &university_key);
        extend_persistent(&env, &owner_key);
        extend_instance(&env);
        env.events().publish(
            (Symbol::new(&env, "UniversityRegistered"), admin),
            university,
        );
        Ok(())
    }

    pub fn approve_university(env: Env, caller: Address, code: String) -> Result<(), Error> {
        require_platform_admin(&env, &caller)?;
        let key = DataKey::UniversityByCode(code.clone());
        let mut university = get_university_internal(&env, &code)?;
        if university.approval_status != UniversityApprovalStatus::PendingApproval {
            return Err(Error::InvalidUniversityStatus);
        }
        university.approval_status = UniversityApprovalStatus::Approved;
        university.updated_at = env.ledger().timestamp();
        env.storage().persistent().set(&key, &university);
        extend_persistent(&env, &key);
        extend_instance(&env);
        env.events()
            .publish((Symbol::new(&env, "UniversityApproved"), caller), code);
        Ok(())
    }

    pub fn reject_university(env: Env, caller: Address, code: String) -> Result<(), Error> {
        require_platform_admin(&env, &caller)?;
        let key = DataKey::UniversityByCode(code.clone());
        let mut university = get_university_internal(&env, &code)?;
        if university.approval_status != UniversityApprovalStatus::PendingApproval {
            return Err(Error::InvalidUniversityStatus);
        }
        university.approval_status = UniversityApprovalStatus::Rejected;
        university.updated_at = env.ledger().timestamp();
        env.storage().persistent().set(&key, &university);
        extend_persistent(&env, &key);
        extend_instance(&env);
        env.events()
            .publish((Symbol::new(&env, "UniversityRejected"), caller), code);
        Ok(())
    }

    pub fn suspend_university(env: Env, caller: Address, code: String) -> Result<(), Error> {
        require_platform_admin(&env, &caller)?;
        let key = DataKey::UniversityByCode(code.clone());
        let mut university = get_university_internal(&env, &code)?;
        if university.approval_status != UniversityApprovalStatus::Approved {
            return Err(Error::InvalidUniversityStatus);
        }
        university.approval_status = UniversityApprovalStatus::Suspended;
        university.updated_at = env.ledger().timestamp();
        env.storage().persistent().set(&key, &university);
        extend_persistent(&env, &key);
        extend_instance(&env);
        Ok(())
    }

    pub fn register_profile(
        env: Env,
        address: Address,
        full_name: String,
        university_code: String,
        role: UserRole,
        details: ProfileDetails,
    ) -> Result<(), Error> {
        address.require_auth();
        let platform_admin = get_platform_admin(&env)?;
        let profile_key = DataKey::Profile(address.clone());
        if env.storage().persistent().has(&profile_key) {
            return Err(Error::ProfileAlreadyExists);
        }
        // The only place a PlatformAdmin profile can be written is initialize.
        if address == platform_admin
            || role == UserRole::PlatformAdmin
            || role == UserRole::UniversityAdmin
        {
            return Err(Error::Unauthorized);
        }
        if !details_match_role(role, &details) {
            return Err(Error::InvalidRole);
        }
        validate_code(&university_code)?;
        if full_name.len() == 0
            || get_university_internal(&env, &university_code)?.approval_status
                != UniversityApprovalStatus::Approved
        {
            return Err(Error::UniversityNotApproved);
        }

        let now = env.ledger().timestamp();
        let profile = Profile {
            address: address.clone(),
            full_name,
            university_code: Some(university_code.clone()),
            role,
            verification_status: VerificationStatus::Pending,
            details,
            created_at: now,
            updated_at: now,
        };
        env.storage().persistent().set(&profile_key, &profile);
        extend_persistent(&env, &profile_key);
        extend_instance(&env);
        env.events().publish(
            (
                Symbol::new(&env, "ProfileSubmittedForVerification"),
                address,
            ),
            university_code,
        );
        Ok(())
    }

    pub fn verify_profile(env: Env, caller: Address, target_address: Address) -> Result<(), Error> {
        caller.require_auth();
        let target_key = DataKey::Profile(target_address.clone());
        let mut target = get_profile_internal(&env, &target_address)?;
        let code = profile_code(&target)?;
        assert_active_university_admin_internal(&env, &caller, &code)?;
        if target.role == UserRole::UniversityAdmin || target.role == UserRole::PlatformAdmin {
            return Err(Error::Unauthorized);
        }
        if target.verification_status != VerificationStatus::Pending {
            return Err(Error::InvalidVerificationStatus);
        }
        target.verification_status = VerificationStatus::Verified;
        target.updated_at = env.ledger().timestamp();
        env.storage().persistent().set(&target_key, &target);
        extend_persistent(&env, &target_key);
        extend_instance(&env);
        env.events().publish(
            (Symbol::new(&env, "ProfileVerified"), caller, target_address),
            code,
        );
        Ok(())
    }

    pub fn reject_profile(env: Env, caller: Address, target_address: Address) -> Result<(), Error> {
        caller.require_auth();
        let target_key = DataKey::Profile(target_address.clone());
        let mut target = get_profile_internal(&env, &target_address)?;
        let code = profile_code(&target)?;
        assert_active_university_admin_internal(&env, &caller, &code)?;
        if target.role == UserRole::UniversityAdmin || target.role == UserRole::PlatformAdmin {
            return Err(Error::Unauthorized);
        }
        if target.verification_status != VerificationStatus::Pending {
            return Err(Error::InvalidVerificationStatus);
        }
        target.verification_status = VerificationStatus::Rejected;
        target.updated_at = env.ledger().timestamp();
        env.storage().persistent().set(&target_key, &target);
        extend_persistent(&env, &target_key);
        extend_instance(&env);
        env.events().publish(
            (Symbol::new(&env, "ProfileRejected"), caller, target_address),
            code,
        );
        Ok(())
    }

    pub fn get_profile(env: Env, address: Address) -> Result<Profile, Error> {
        get_profile_internal(&env, &address)
    }

    pub fn get_university(env: Env, code: String) -> Result<University, Error> {
        get_university_internal(&env, &code)
    }

    /// Returns false for Platform Admin or profiles without a university. It does not
    /// imply active/verified status; callers wanting authorization use the assert helper.
    pub fn is_same_university(env: Env, left: Address, right: Address) -> Result<bool, Error> {
        let left_profile = get_profile_internal(&env, &left)?;
        let right_profile = get_profile_internal(&env, &right)?;
        if left_profile.role == UserRole::PlatformAdmin
            || right_profile.role == UserRole::PlatformAdmin
        {
            return Ok(false);
        }
        Ok(profile_code(&left_profile)? == profile_code(&right_profile)?)
    }

    pub fn assert_active_profile(env: Env, address: Address) -> Result<Profile, Error> {
        assert_active_profile_internal(&env, &address)
    }

    pub fn assert_active_role(
        env: Env,
        address: Address,
        role: UserRole,
    ) -> Result<Profile, Error> {
        let profile = assert_active_profile_internal(&env, &address)?;
        if profile.role != role {
            return Err(Error::Unauthorized);
        }
        Ok(profile)
    }

    pub fn assert_active_role_any(
        env: Env,
        address: Address,
        roles: Vec<UserRole>,
    ) -> Result<Profile, Error> {
        let profile = assert_active_profile_internal(&env, &address)?;
        for role in roles.iter() {
            if profile.role == role {
                return Ok(profile);
            }
        }
        Err(Error::Unauthorized)
    }

    pub fn assert_active_same_university(
        env: Env,
        left: Address,
        right: Address,
    ) -> Result<(), Error> {
        let left_profile = assert_active_profile_internal(&env, &left)?;
        let right_profile = assert_active_profile_internal(&env, &right)?;
        if left_profile.role == UserRole::PlatformAdmin
            || right_profile.role == UserRole::PlatformAdmin
        {
            return Err(Error::UniversityCodeMismatch);
        }
        if profile_code(&left_profile)? != profile_code(&right_profile)? {
            return Err(Error::UniversityCodeMismatch);
        }
        Ok(())
    }

    pub fn assert_active_university_admin(
        env: Env,
        address: Address,
        university_code: String,
    ) -> Result<Profile, Error> {
        assert_active_university_admin_internal(&env, &address, &university_code)
    }

    pub fn active_university_code(env: Env, address: Address) -> Result<String, Error> {
        profile_code(&assert_active_profile_internal(&env, &address)?)
    }

    pub fn assert_active_food_merchant(env: Env, address: Address) -> Result<Profile, Error> {
        let profile = Self::assert_active_role(env, address, UserRole::Merchant)?;
        match profile.details {
            ProfileDetails::Merchant(MerchantDetails {
                category: MerchantCategory::FoodCanteen,
                ..
            }) => Ok(profile),
            _ => Err(Error::Unauthorized),
        }
    }
}
