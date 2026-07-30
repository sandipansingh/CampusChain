#![no_std]

//! CAMP token. Identity is the sole role authority; this contract only keeps
//! balances and refuses CAMP movement outside a verified university boundary.

mod identity_wasm {
    soroban_sdk::contractimport!(file = "../campus-service/wasm/campus_identity.wasm");
}

use identity_wasm::Client as CampusIdentityClient;
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
    InsufficientBalance = 4,
    InsufficientAllowance = 5,
    InvalidAmount = 6,
    IdentityCheckFailed = 7,
    AlreadyClaimed = 8,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    PlatformAdmin,
    IdentityContract,
    ServiceContract,
    TotalSupply,
    TokenName,
    TokenSymbol,
    TokenDecimals,
    Balance(Address),
    Allowance(Address, Address),
    FaucetClaimed(Address),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AllowanceData {
    pub amount: i128,
    pub expiration_ledger: u32,
}

const FAUCET_AMOUNT: i128 = 100_000_0000;
const LEDGER_THRESHOLD_INSTANCE: u32 = 1_000;
const LEDGER_EXTEND_TO_INSTANCE: u32 = 10_000;
const LEDGER_THRESHOLD_PERSISTENT: u32 = 1_000;
const LEDGER_EXTEND_TO_PERSISTENT: u32 = 10_000;

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

fn get_address(env: &Env, key: DataKey) -> Result<Address, Error> {
    env.storage()
        .instance()
        .get(&key)
        .ok_or(Error::NotInitialized)
}

fn require_platform_admin(env: &Env) -> Result<Address, Error> {
    let admin = get_address(env, DataKey::PlatformAdmin)?;
    admin.require_auth();
    Ok(admin)
}

fn identity_client(env: &Env) -> Result<CampusIdentityClient<'_>, Error> {
    Ok(CampusIdentityClient::new(
        env,
        &get_address(env, DataKey::IdentityContract)?,
    ))
}

fn is_active_profile(env: &Env, address: &Address) -> bool {
    matches!(
        identity_client(env).and_then(|client| {
            if matches!(client.try_assert_active_profile(address), Ok(Ok(_))) {
                Ok(())
            } else {
                Err(Error::IdentityCheckFailed)
            }
        }),
        Ok(())
    )
}

fn assert_transfer_scope(env: &Env, from: &Address, to: &Address) -> Result<(), Error> {
    let service = get_address(env, DataKey::ServiceContract)?;
    if *to == service {
        return if is_active_profile(env, from) {
            Ok(())
        } else {
            Err(Error::IdentityCheckFailed)
        };
    }
    if *from == service {
        return if is_active_profile(env, to) {
            Ok(())
        } else {
            Err(Error::IdentityCheckFailed)
        };
    }
    let client = identity_client(env)?;
    if matches!(
        client.try_assert_active_same_university(from, to),
        Ok(Ok(()))
    ) {
        Ok(())
    } else {
        Err(Error::IdentityCheckFailed)
    }
}

fn do_mint(env: &Env, to: &Address, amount: i128) {
    let to_key = DataKey::Balance(to.clone());
    let balance = env.storage().persistent().get(&to_key).unwrap_or(0i128);
    env.storage().persistent().set(&to_key, &(balance + amount));
    extend_persistent(env, &to_key);

    let total_supply: i128 = env
        .storage()
        .instance()
        .get(&DataKey::TotalSupply)
        .unwrap_or(0i128);
    env.storage()
        .instance()
        .set(&DataKey::TotalSupply, &(total_supply + amount));
    extend_instance(env);
}

fn assert_mint_recipient(env: &Env, to: &Address) -> Result<(), Error> {
    if *to == get_address(env, DataKey::ServiceContract)? || is_active_profile(env, to) {
        Ok(())
    } else {
        Err(Error::IdentityCheckFailed)
    }
}

#[contract]
pub struct CampusToken;

#[contractimpl]
impl CampusToken {
    pub fn initialize(
        env: Env,
        platform_admin: Address,
        identity_contract: Address,
        service_contract: Address,
        decimals: u32,
        name: String,
        symbol: String,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::PlatformAdmin) {
            return Err(Error::AlreadyInitialized);
        }
        platform_admin.require_auth();
        let identity = CampusIdentityClient::new(&env, &identity_contract);
        if !matches!(identity.try_platform_admin(), Ok(Ok(address)) if address == platform_admin) {
            return Err(Error::Unauthorized);
        }
        if name.len() == 0 || symbol.len() == 0 {
            return Err(Error::InvalidAmount);
        }
        env.storage()
            .instance()
            .set(&DataKey::PlatformAdmin, &platform_admin);
        env.storage()
            .instance()
            .set(&DataKey::IdentityContract, &identity_contract);
        env.storage()
            .instance()
            .set(&DataKey::ServiceContract, &service_contract);
        env.storage()
            .instance()
            .set(&DataKey::TokenDecimals, &decimals);
        env.storage().instance().set(&DataKey::TokenName, &name);
        env.storage().instance().set(&DataKey::TokenSymbol, &symbol);
        env.storage().instance().set(&DataKey::TotalSupply, &0i128);
        extend_instance(&env);
        Ok(())
    }

    pub fn platform_admin(env: Env) -> Result<Address, Error> {
        get_address(&env, DataKey::PlatformAdmin)
    }

    pub fn identity_contract(env: Env) -> Result<Address, Error> {
        get_address(&env, DataKey::IdentityContract)
    }

    pub fn service_contract(env: Env) -> Result<Address, Error> {
        get_address(&env, DataKey::ServiceContract)
    }

    pub fn name(env: Env) -> Result<String, Error> {
        env.storage()
            .instance()
            .get(&DataKey::TokenName)
            .ok_or(Error::NotInitialized)
    }

    pub fn symbol(env: Env) -> Result<String, Error> {
        env.storage()
            .instance()
            .get(&DataKey::TokenSymbol)
            .ok_or(Error::NotInitialized)
    }

    pub fn decimals(env: Env) -> Result<u32, Error> {
        env.storage()
            .instance()
            .get(&DataKey::TokenDecimals)
            .ok_or(Error::NotInitialized)
    }

    pub fn total_supply(env: Env) -> Result<i128, Error> {
        env.storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .ok_or(Error::NotInitialized)
    }

    pub fn balance(env: Env, id: Address) -> Result<i128, Error> {
        get_address(&env, DataKey::PlatformAdmin)?;
        let key = DataKey::Balance(id);
        extend_persistent(&env, &key);
        Ok(env.storage().persistent().get(&key).unwrap_or(0i128))
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) -> Result<(), Error> {
        get_address(&env, DataKey::PlatformAdmin)?;
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        from.require_auth();
        assert_transfer_scope(&env, &from, &to)?;
        let from_key = DataKey::Balance(from.clone());
        let to_key = DataKey::Balance(to.clone());
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
        extend_persistent(&env, &from_key);
        extend_persistent(&env, &to_key);
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
        get_address(&env, DataKey::PlatformAdmin)?;
        if amount < 0 {
            return Err(Error::InvalidAmount);
        }
        from.require_auth();
        if !is_active_profile(&env, &from) {
            return Err(Error::IdentityCheckFailed);
        }
        let key = DataKey::Allowance(from.clone(), spender.clone());
        env.storage().persistent().set(
            &key,
            &AllowanceData {
                amount,
                expiration_ledger,
            },
        );
        extend_persistent(&env, &key);
        extend_instance(&env);
        env.events().publish(
            (Symbol::new(&env, "approve"), from, spender),
            (amount, expiration_ledger),
        );
        Ok(())
    }

    pub fn allowance(env: Env, from: Address, spender: Address) -> Result<i128, Error> {
        get_address(&env, DataKey::PlatformAdmin)?;
        let key = DataKey::Allowance(from, spender);
        extend_persistent(&env, &key);
        match env
            .storage()
            .persistent()
            .get::<DataKey, AllowanceData>(&key)
        {
            Some(allowance) if allowance.expiration_ledger >= env.ledger().sequence() => {
                Ok(allowance.amount)
            }
            _ => Ok(0),
        }
    }

    pub fn transfer_from(
        env: Env,
        spender: Address,
        from: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), Error> {
        get_address(&env, DataKey::PlatformAdmin)?;
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        spender.require_auth();
        assert_transfer_scope(&env, &from, &to)?;
        let allowance_key = DataKey::Allowance(from.clone(), spender.clone());
        let allowance: AllowanceData = env
            .storage()
            .persistent()
            .get(&allowance_key)
            .ok_or(Error::InsufficientAllowance)?;
        if allowance.expiration_ledger < env.ledger().sequence() || allowance.amount < amount {
            return Err(Error::InsufficientAllowance);
        }
        let from_key = DataKey::Balance(from.clone());
        let to_key = DataKey::Balance(to.clone());
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
        env.storage().persistent().set(
            &allowance_key,
            &AllowanceData {
                amount: allowance.amount - amount,
                expiration_ledger: allowance.expiration_ledger,
            },
        );
        extend_persistent(&env, &from_key);
        extend_persistent(&env, &to_key);
        extend_persistent(&env, &allowance_key);
        extend_instance(&env);
        env.events()
            .publish((Symbol::new(&env, "transfer"), from, to), amount);
        Ok(())
    }

    pub fn mint(env: Env, to: Address, amount: i128) -> Result<(), Error> {
        let admin = require_platform_admin(&env)?;
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        assert_mint_recipient(&env, &to)?;
        do_mint(&env, &to, amount);
        env.events()
            .publish((Symbol::new(&env, "mint"), admin, to), amount);
        Ok(())
    }

    pub fn mint_purchase(
        env: Env,
        caller: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if caller != get_address(&env, DataKey::ServiceContract)? {
            return Err(Error::Unauthorized);
        }
        caller.require_auth();
        assert_mint_recipient(&env, &to)?;
        do_mint(&env, &to, amount);
        env.events()
            .publish((Symbol::new(&env, "mint_purchase"), to), amount);
        Ok(())
    }

    pub fn burn(env: Env, from: Address, amount: i128) -> Result<(), Error> {
        from.require_auth();
        if amount <= 0 || !is_active_profile(&env, &from) {
            return Err(Error::InvalidAmount);
        }
        let key = DataKey::Balance(from.clone());
        let balance = env.storage().persistent().get(&key).unwrap_or(0i128);
        if balance < amount {
            return Err(Error::InsufficientBalance);
        }
        let supply: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalSupply)
            .unwrap_or(0);
        env.storage().persistent().set(&key, &(balance - amount));
        env.storage()
            .instance()
            .set(&DataKey::TotalSupply, &(supply - amount));
        extend_persistent(&env, &key);
        extend_instance(&env);
        env.events()
            .publish((Symbol::new(&env, "burn"), from), amount);
        Ok(())
    }

    pub fn faucet(env: Env, to: Address) -> Result<(), Error> {
        to.require_auth();
        if !is_active_profile(&env, &to) {
            return Err(Error::IdentityCheckFailed);
        }
        let key = DataKey::FaucetClaimed(to.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::AlreadyClaimed);
        }
        env.storage().persistent().set(&key, &true);
        extend_persistent(&env, &key);
        do_mint(&env, &to, FAUCET_AMOUNT);
        env.events()
            .publish((Symbol::new(&env, "faucet"), to), FAUCET_AMOUNT);
        Ok(())
    }

    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) -> Result<(), Error> {
        require_platform_admin(&env)?;
        env.deployer().update_current_contract_wasm(new_wasm_hash);
        Ok(())
    }
}
