#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, BytesN, Env, String, Symbol, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    InsufficientBalance = 4,
    InsufficientAllowance = 5,
    InvalidAmount = 6,
    InvalidRole = 7,
    AlreadyClaimed = 8,
    RoleRequestNotFound = 9,
    PendingRoleRequest = 10,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    TotalSupply,
    TokenName,
    TokenSymbol,
    TokenDecimals,
    Balance(Address),
    Allowance(Address, Address),
    Role(Address),
    FaucetClaimed(Address),
    RoleRequestCounter,
    RoleRequest(u64),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AllowanceData {
    pub amount: i128,
    pub expiration_ledger: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RoleRequestData {
    pub id: u64,
    pub applicant: Address,
    pub requested_role: u32,
    pub status: u32, // 0: pending, 1: approved, 2: denied
}

const LEDGER_THRESHOLD_INSTANCE: u32 = 1000;
const LEDGER_EXTEND_TO_INSTANCE: u32 = 10000;

const LEDGER_THRESHOLD_PERSISTENT: u32 = 1000;
const LEDGER_EXTEND_TO_PERSISTENT: u32 = 10000;

fn has_admin(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

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

fn do_mint(env: &Env, to: &Address, amount: i128) {
    let to_key = DataKey::Balance(to.clone());
    extend_persistent(env, &to_key);

    let balance = env.storage().persistent().get(&to_key).unwrap_or(0i128);
    env.storage().persistent().set(&to_key, &(balance + amount));

    let total_supply_key = DataKey::TotalSupply;
    let total_supply: i128 = env
        .storage()
        .instance()
        .get(&total_supply_key)
        .unwrap_or(0i128);
    env.storage()
        .instance()
        .set(&total_supply_key, &(total_supply + amount));

    extend_instance(env);
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
pub struct CampusToken;

#[contractimpl]
impl CampusToken {
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
        decimals: u32,
    ) -> Result<(), Error> {
        if has_admin(&env) {
            return Err(Error::AlreadyInitialized);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TotalSupply, &0i128);
        env.storage().instance().set(&DataKey::TokenName, &name);
        env.storage().instance().set(&DataKey::TokenSymbol, &symbol);
        env.storage()
            .instance()
            .set(&DataKey::TokenDecimals, &decimals);

        extend_instance(&env);

        env.events().publish(
            (Symbol::new(&env, "initialize"), admin),
            (name, symbol, decimals),
        );

        Ok(())
    }

    pub fn admin(env: Env) -> Result<Address, Error> {
        extend_instance(&env);
        get_admin(&env)
    }

    pub fn name(env: Env) -> Result<String, Error> {
        extend_instance(&env);
        env.storage()
            .instance()
            .get(&DataKey::TokenName)
            .ok_or(Error::NotInitialized)
    }

    pub fn symbol(env: Env) -> Result<String, Error> {
        extend_instance(&env);
        env.storage()
            .instance()
            .get(&DataKey::TokenSymbol)
            .ok_or(Error::NotInitialized)
    }

    pub fn decimals(env: Env) -> Result<u32, Error> {
        extend_instance(&env);
        env.storage()
            .instance()
            .get(&DataKey::TokenDecimals)
            .ok_or(Error::NotInitialized)
    }

    pub fn total_supply(env: Env) -> Result<i128, Error> {
        extend_instance(&env);
        env.storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .ok_or(Error::NotInitialized)
    }

    pub fn balance(env: Env, id: Address) -> Result<i128, Error> {
        if !has_admin(&env) {
            return Err(Error::NotInitialized);
        }
        let key = DataKey::Balance(id);
        extend_persistent(&env, &key);
        Ok(env.storage().persistent().get(&key).unwrap_or(0i128))
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) -> Result<(), Error> {
        if !has_admin(&env) {
            return Err(Error::NotInitialized);
        }
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        from.require_auth();

        let from_key = DataKey::Balance(from.clone());
        let to_key = DataKey::Balance(to.clone());

        extend_persistent(&env, &from_key);
        extend_persistent(&env, &to_key);

        let from_balance = env.storage().persistent().get(&from_key).unwrap_or(0i128);
        if from_balance < amount {
            return Err(Error::InsufficientBalance);
        }

        let to_balance = env.storage().persistent().get(&to_key).unwrap_or(0i128);

        env.storage()
            .persistent()
            .set(&from_key, &(from_balance - amount));
        env.storage()
            .persistent()
            .set(&to_key, &(to_balance + amount));

        extend_instance(&env);

        env.events()
            .publish((Symbol::new(&env, "transfer"), from, to), amount);

        Ok(())
    }

    pub fn approve(
        env: Env,
        from: Address,
        spender: Address,
        amount: i128,
        expiration_ledger: u32,
    ) -> Result<(), Error> {
        if !has_admin(&env) {
            return Err(Error::NotInitialized);
        }
        if amount < 0 {
            return Err(Error::InvalidAmount);
        }
        from.require_auth();

        let key = DataKey::Allowance(from.clone(), spender.clone());
        extend_persistent(&env, &key);

        let allowance_data = AllowanceData {
            amount,
            expiration_ledger,
        };

        env.storage().persistent().set(&key, &allowance_data);

        extend_instance(&env);

        env.events().publish(
            (Symbol::new(&env, "approve"), from, spender),
            (amount, expiration_ledger),
        );

        Ok(())
    }

    pub fn allowance(env: Env, from: Address, spender: Address) -> Result<i128, Error> {
        if !has_admin(&env) {
            return Err(Error::NotInitialized);
        }
        let key = DataKey::Allowance(from, spender);
        extend_persistent(&env, &key);

        let opt_allowance: Option<AllowanceData> = env.storage().persistent().get(&key);
        if let Some(allowance) = opt_allowance {
            if allowance.expiration_ledger < env.ledger().sequence() {
                Ok(0i128)
            } else {
                Ok(allowance.amount)
            }
        } else {
            Ok(0i128)
        }
    }

    pub fn transfer_from(
        env: Env,
        spender: Address,
        from: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), Error> {
        if !has_admin(&env) {
            return Err(Error::NotInitialized);
        }
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        spender.require_auth();

        let allowance_key = DataKey::Allowance(from.clone(), spender.clone());
        extend_persistent(&env, &allowance_key);

        let allowance_data: AllowanceData = env
            .storage()
            .persistent()
            .get(&allowance_key)
            .ok_or(Error::InsufficientAllowance)?;

        if allowance_data.expiration_ledger < env.ledger().sequence() {
            return Err(Error::InsufficientAllowance);
        }
        if allowance_data.amount < amount {
            return Err(Error::InsufficientAllowance);
        }

        let from_key = DataKey::Balance(from.clone());
        let to_key = DataKey::Balance(to.clone());

        extend_persistent(&env, &from_key);
        extend_persistent(&env, &to_key);

        let from_balance = env.storage().persistent().get(&from_key).unwrap_or(0i128);
        if from_balance < amount {
            return Err(Error::InsufficientBalance);
        }

        let to_balance = env.storage().persistent().get(&to_key).unwrap_or(0i128);

        env.storage()
            .persistent()
            .set(&from_key, &(from_balance - amount));
        env.storage()
            .persistent()
            .set(&to_key, &(to_balance + amount));

        let new_allowance = AllowanceData {
            amount: allowance_data.amount - amount,
            expiration_ledger: allowance_data.expiration_ledger,
        };
        env.storage()
            .persistent()
            .set(&allowance_key, &new_allowance);

        extend_instance(&env);

        env.events()
            .publish((Symbol::new(&env, "transfer"), from, to), amount);

        Ok(())
    }

    pub fn mint(env: Env, to: Address, amount: i128) -> Result<(), Error> {
        let admin = get_admin(&env)?;
        admin.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        do_mint(&env, &to, amount);

        env.events()
            .publish((Symbol::new(&env, "mint"), admin, to), amount);

        Ok(())
    }

    pub fn mint_purchase(env: Env, to: Address, amount: i128) -> Result<(), Error> {
        // Called by CampusService — no admin auth needed for purchase flow
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        do_mint(&env, &to, amount);

        env.events()
            .publish((Symbol::new(&env, "mint_purchase"), to), amount);

        Ok(())
    }

    pub fn burn(env: Env, from: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let from_key = DataKey::Balance(from.clone());
        extend_persistent(&env, &from_key);

        let balance = env.storage().persistent().get(&from_key).unwrap_or(0i128);
        if balance < amount {
            return Err(Error::InsufficientBalance);
        }

        env.storage()
            .persistent()
            .set(&from_key, &(balance - amount));

        let total_supply_key = DataKey::TotalSupply;
        let total_supply: i128 = env
            .storage()
            .instance()
            .get(&total_supply_key)
            .unwrap_or(0i128);
        env.storage()
            .instance()
            .set(&total_supply_key, &(total_supply - amount));

        extend_instance(&env);

        env.events()
            .publish((Symbol::new(&env, "burn"), from), amount);

        Ok(())
    }

    pub fn set_role(env: Env, admin: Address, address: Address, role: u32) -> Result<(), Error> {
        if role > 4 {
            return Err(Error::InvalidRole);
        }

        if role <= 1 {
            // Student (1) and Guest (0): self-assignable by user OR set by super-admin
            if admin == address {
                address.require_auth();
            } else {
                let stored_admin = get_admin(&env)?;
                stored_admin.require_auth();
                if admin != stored_admin {
                    return Err(Error::Unauthorized);
                }
            }
        } else {
            // Merchant (2), Club (3), Admin (4) require super-admin auth
            let stored_admin = get_admin(&env)?;
            stored_admin.require_auth();
            if admin != stored_admin {
                return Err(Error::Unauthorized);
            }
        }

        let key = DataKey::Role(address.clone());
        extend_persistent(&env, &key);
        env.storage().persistent().set(&key, &role);

        extend_instance(&env);

        env.events()
            .publish((Symbol::new(&env, "role_updated"), address), role);

        Ok(())
    }

    pub fn request_role_change(
        env: Env,
        applicant: Address,
        requested_role: u32,
    ) -> Result<u64, Error> {
        applicant.require_auth();

        let current_role_key = DataKey::Role(applicant.clone());
        extend_persistent(&env, &current_role_key);
        let current_role: u32 = env
            .storage()
            .persistent()
            .get(&current_role_key)
            .unwrap_or(0);

        if requested_role < 2 || requested_role > 3 {
            return Err(Error::InvalidRole);
        }
        if current_role != 0 && current_role != 1 {
            return Err(Error::InvalidRole);
        }

        // Check no existing pending request
        extend_instance(&env);
        let counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::RoleRequestCounter)
            .unwrap_or(0);
        for id in 1..=counter {
            let key = DataKey::RoleRequest(id);
            if let Some(req) = env
                .storage()
                .persistent()
                .get::<DataKey, RoleRequestData>(&key)
            {
                if req.applicant == applicant && req.status == 0 {
                    return Err(Error::PendingRoleRequest);
                }
            }
        }

        let mut req_counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::RoleRequestCounter)
            .unwrap_or(0);
        req_counter += 1;
        env.storage()
            .instance()
            .set(&DataKey::RoleRequestCounter, &req_counter);

        let request = RoleRequestData {
            id: req_counter,
            applicant: applicant.clone(),
            requested_role,
            status: 0,
        };

        let req_key = DataKey::RoleRequest(req_counter);
        env.storage().persistent().set(&req_key, &request);
        extend_persistent(&env, &req_key);
        extend_instance(&env);

        env.events().publish(
            (
                Symbol::new(&env, "role_change_requested"),
                req_counter,
                applicant,
            ),
            requested_role,
        );

        Ok(req_counter)
    }

    pub fn approve_role_change(env: Env, request_id: u64, admin: Address) -> Result<(), Error> {
        let stored_admin = get_admin(&env)?;
        stored_admin.require_auth();
        if admin != stored_admin {
            return Err(Error::Unauthorized);
        }

        let req_key = DataKey::RoleRequest(request_id);
        extend_persistent(&env, &req_key);
        let mut request: RoleRequestData = env
            .storage()
            .persistent()
            .get(&req_key)
            .ok_or(Error::RoleRequestNotFound)?;

        if request.status != 0 {
            return Err(Error::RoleRequestNotFound);
        }

        request.status = 1;
        env.storage().persistent().set(&req_key, &request);

        // Apply the role
        let role_key = DataKey::Role(request.applicant.clone());
        extend_persistent(&env, &role_key);
        env.storage()
            .persistent()
            .set(&role_key, &request.requested_role);
        extend_instance(&env);

        env.events().publish(
            (Symbol::new(&env, "role_updated"), request.applicant.clone()),
            request.requested_role,
        );
        env.events().publish(
            (
                Symbol::new(&env, "role_change_approved"),
                request_id,
                request.applicant,
            ),
            request.requested_role,
        );

        Ok(())
    }

    pub fn deny_role_change(env: Env, request_id: u64, admin: Address) -> Result<(), Error> {
        let stored_admin = get_admin(&env)?;
        stored_admin.require_auth();
        if admin != stored_admin {
            return Err(Error::Unauthorized);
        }

        let req_key = DataKey::RoleRequest(request_id);
        extend_persistent(&env, &req_key);
        let mut request: RoleRequestData = env
            .storage()
            .persistent()
            .get(&req_key)
            .ok_or(Error::RoleRequestNotFound)?;

        if request.status != 0 {
            return Err(Error::RoleRequestNotFound);
        }

        request.status = 2;
        env.storage().persistent().set(&req_key, &request);
        extend_instance(&env);

        env.events().publish(
            (Symbol::new(&env, "role_change_denied"), request_id),
            (request.applicant, request.requested_role),
        );

        Ok(())
    }

    pub fn get_role_request(env: Env, id: u64) -> Result<RoleRequestData, Error> {
        let key = DataKey::RoleRequest(id);
        extend_persistent(&env, &key);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(Error::RoleRequestNotFound)
    }

    pub fn list_pending_role_requests(env: Env) -> Result<Vec<RoleRequestData>, Error> {
        extend_instance(&env);
        let counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::RoleRequestCounter)
            .unwrap_or(0);

        let mut requests = Vec::new(&env);
        for id in 1..=counter {
            let key = DataKey::RoleRequest(id);
            if let Some(req) = env
                .storage()
                .persistent()
                .get::<DataKey, RoleRequestData>(&key)
            {
                if req.status == 0 {
                    requests.push_back(req);
                }
            }
        }
        Ok(requests)
    }

    pub fn get_role(env: Env, address: Address) -> Result<u32, Error> {
        if !has_admin(&env) {
            return Err(Error::NotInitialized);
        }
        let key = DataKey::Role(address);
        extend_persistent(&env, &key);
        Ok(env.storage().persistent().get(&key).unwrap_or(0u32)) // Default to 0 (Guest)
    }

    pub fn has_claimed_faucet(env: Env, address: Address) -> bool {
        let claimed_key = DataKey::FaucetClaimed(address);
        env.storage()
            .persistent()
            .get::<DataKey, bool>(&claimed_key)
            .unwrap_or(false)
    }

    pub fn faucet(env: Env, to: Address, amount: i128) -> Result<(), Error> {
        to.require_auth();

        if !has_admin(&env) {
            return Err(Error::NotInitialized);
        }
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let claimed_key = DataKey::FaucetClaimed(to.clone());
        extend_persistent(&env, &claimed_key);
        if env
            .storage()
            .persistent()
            .get::<DataKey, bool>(&claimed_key)
            .unwrap_or(false)
        {
            return Err(Error::AlreadyClaimed);
        }

        let to_key = DataKey::Balance(to.clone());
        extend_persistent(&env, &to_key);

        let balance = env.storage().persistent().get(&to_key).unwrap_or(0i128);
        env.storage().persistent().set(&to_key, &(balance + amount));

        let total_supply_key = DataKey::TotalSupply;
        let total_supply: i128 = env
            .storage()
            .instance()
            .get(&total_supply_key)
            .unwrap_or(0i128);
        env.storage()
            .instance()
            .set(&total_supply_key, &(total_supply + amount));

        env.storage().persistent().set(&claimed_key, &true);

        extend_instance(&env);

        env.events()
            .publish((Symbol::new(&env, "faucet"), to), amount);

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
