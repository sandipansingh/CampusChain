/*
CALL CHAIN DOCUMENTATION:
=========================
This contract (CampusIdentity) acts as the single source of truth for identity and roles.
It is invoked by the CampusService contract to verify roles and verification statuses:
1. CampusService::create_event -> calls CampusIdentity::get_profile (verifies caller is Club/Admin)
2. CampusService::register_university -> calls CampusIdentity::get_profile (verifies caller is Admin)
3. CampusService::create_listing -> calls CampusIdentity::get_profile (verifies caller is Student/Merchant)
4. CampusService::apply_for_scholarship -> calls CampusIdentity::get_profile (verifies applicant is Student and verified)
5. CampusService::create_utility_reward -> calls CampusIdentity::get_profile (verifies creator is Admin)
6. CampusService::disburse_scholarship -> calls CampusIdentity::get_profile (verifies sender is Admin)
*/

#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, BytesN, Env, String, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    ProfileNotFound = 4,
    ProfileAlreadyExists = 5,
    InvalidInput = 6,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum UserRole {
    Student = 1,
    Merchant = 2,
    Admin = 4,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Profile {
    pub address: Address,
    pub full_name: String,
    pub university_id: String,
    pub department: String,
    pub role: UserRole,
    pub verified: bool,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    Profile(Address),
}

const LEDGER_THRESHOLD_INSTANCE: u32 = 1000;
const LEDGER_EXTEND_TO_INSTANCE: u32 = 10000;

const LEDGER_THRESHOLD_PERSISTENT: u32 = 1000;
const LEDGER_EXTEND_TO_PERSISTENT: u32 = 10000;

fn get_admin(env: &Env) -> Result<Address, Error> {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)
}

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

#[contract]
pub struct CampusIdentity;

#[contractimpl]
impl CampusIdentity {
    pub fn initialize(
        env: Env,
        admin: Address,
        full_name: String,
        university_id: String,
        department: String,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }

        if full_name.len() == 0 || department.len() == 0 || university_id.len() == 0 {
            return Err(Error::InvalidInput);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);

        let admin_profile = Profile {
            address: admin.clone(),
            full_name: full_name.clone(),
            university_id: university_id.clone(),
            department: department.clone(),
            role: UserRole::Admin,
            verified: true,
            created_at: env.ledger().timestamp(),
        };

        let profile_key = DataKey::Profile(admin.clone());
        env.storage().persistent().set(&profile_key, &admin_profile);

        extend_instance(&env);
        extend_persistent(&env, &profile_key);

        env.events().publish(
            (Symbol::new(&env, "initialize"), admin),
            (full_name, university_id, department),
        );

        Ok(())
    }

    pub fn register_profile(
        env: Env,
        address: Address,
        full_name: String,
        university_id: String,
        department: String,
    ) -> Result<(), Error> {
        address.require_auth();

        if !env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }

        let profile_key = DataKey::Profile(address.clone());
        if env.storage().persistent().has(&profile_key) {
            return Err(Error::ProfileAlreadyExists);
        }

        if full_name.len() == 0 || department.len() == 0 || university_id.len() == 0 {
            return Err(Error::InvalidInput);
        }

        let new_profile = Profile {
            address: address.clone(),
            full_name: full_name.clone(),
            university_id: university_id.clone(),
            department: department.clone(),
            role: UserRole::Student,
            verified: false,
            created_at: env.ledger().timestamp(),
        };

        env.storage().persistent().set(&profile_key, &new_profile);

        extend_instance(&env);
        extend_persistent(&env, &profile_key);

        env.events().publish(
            (Symbol::new(&env, "profile_registered"), address),
            (full_name, university_id, department),
        );

        Ok(())
    }

    pub fn get_profile(env: Env, address: Address) -> Result<Profile, Error> {
        let profile_key = DataKey::Profile(address);
        extend_persistent(&env, &profile_key);

        env.storage()
            .persistent()
            .get(&profile_key)
            .ok_or(Error::ProfileNotFound)
    }

    pub fn set_role(
        env: Env,
        admin: Address,
        target_address: Address,
        role: UserRole,
    ) -> Result<(), Error> {
        admin.require_auth();

        let admin_addr = get_admin(&env)?;
        if admin != admin_addr {
            return Err(Error::Unauthorized);
        }

        let profile_key = DataKey::Profile(target_address.clone());
        let mut profile: Profile = env
            .storage()
            .persistent()
            .get(&profile_key)
            .ok_or(Error::ProfileNotFound)?;

        profile.role = role;
        env.storage().persistent().set(&profile_key, &profile);

        extend_instance(&env);
        extend_persistent(&env, &profile_key);

        env.events().publish(
            (Symbol::new(&env, "role_updated"), target_address),
            role as u32,
        );

        Ok(())
    }

    pub fn set_verified(
        env: Env,
        admin: Address,
        target_address: Address,
        verified: bool,
    ) -> Result<(), Error> {
        admin.require_auth();

        let admin_addr = get_admin(&env)?;
        if admin != admin_addr {
            return Err(Error::Unauthorized);
        }

        let profile_key = DataKey::Profile(target_address.clone());
        let mut profile: Profile = env
            .storage()
            .persistent()
            .get(&profile_key)
            .ok_or(Error::ProfileNotFound)?;

        profile.verified = verified;
        env.storage().persistent().set(&profile_key, &profile);

        extend_instance(&env);
        extend_persistent(&env, &profile_key);

        env.events().publish(
            (Symbol::new(&env, "profile_verified"), target_address),
            verified,
        );

        Ok(())
    }

    pub fn update_profile(
        env: Env,
        address: Address,
        full_name: String,
        university_id: String,
        department: String,
    ) -> Result<(), Error> {
        address.require_auth();

        if full_name.len() == 0 || department.len() == 0 || university_id.len() == 0 {
            return Err(Error::InvalidInput);
        }

        let profile_key = DataKey::Profile(address.clone());
        let mut profile: Profile = env
            .storage()
            .persistent()
            .get(&profile_key)
            .ok_or(Error::ProfileNotFound)?;

        profile.full_name = full_name.clone();
        profile.university_id = university_id.clone();
        profile.department = department.clone();

        env.storage().persistent().set(&profile_key, &profile);

        extend_instance(&env);
        extend_persistent(&env, &profile_key);

        env.events().publish(
            (Symbol::new(&env, "profile_updated"), address),
            (full_name, university_id, department),
        );

        Ok(())
    }

    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) -> Result<(), Error> {
        let admin = get_admin(&env)?;
        admin.require_auth();

        env.deployer().update_current_contract_wasm(new_wasm_hash);
        extend_instance(&env);

        Ok(())
    }
}

#[cfg(test)]
mod test;
