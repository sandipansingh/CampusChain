#![no_std]

//! CampusService contains university-scoped product modules. CampusIdentity owns
//! profiles and university approval; this contract never keeps a second registry.

mod token_wasm {
    soroban_sdk::contractimport!(file = "wasm/campus_token.wasm");
}
mod identity_wasm {
    soroban_sdk::contractimport!(file = "wasm/campus_identity.wasm");
}

use identity_wasm::{Client as CampusIdentityClient, UserRole as IdentityUserRole};
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, BytesN, Env, String, Symbol, Vec,
};
use token_wasm::Client as CampusTokenClient;

#[cfg(test)]
mod test;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    NotFound = 4,
    InvalidStatus = 5,
    InvalidAmount = 6,
    CapacityReached = 7,
    IdentityCheckFailed = 8,
    InvalidInput = 9,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    PlatformAdmin,
    TokenContract,
    IdentityContract,
    NativeTokenContract,
    EscrowCounter,
    Escrow(u64),
    EventCounter,
    Event(u64),
    TicketCounter,
    Ticket(u64),
    ListingCounter,
    Listing(u64),
    ListingEscrow(u64),
    ScholarshipProgramCounter,
    ScholarshipProgram(u64),
    ScholarshipApplicationCounter,
    ScholarshipApplication(u64),
    UtilityRewardCounter,
    UtilityReward(u64),
    RedemptionCounter,
    Redemption(u64),
    MenuItemCounter,
    MenuItem(u64),
    FoodOrderCounter,
    FoodOrder(u64),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowAgreement {
    pub id: u64,
    pub buyer: Address,
    pub seller: Address,
    pub university_code: String,
    pub amount: i128,
    /// 1: Funded, 2: Completed, 3: Refunded.
    pub status: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EventDetails {
    pub id: u64,
    pub host: Address,
    pub university_code: String,
    pub price: i128,
    pub capacity: u32,
    pub tickets_sold: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TicketDetails {
    pub id: u64,
    pub event_id: u64,
    pub owner: Address,
    pub university_code: String,
    pub redeemed: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MarketplaceListing {
    pub id: u64,
    pub seller: Address,
    pub university_code: String,
    pub title: String,
    pub description: String,
    pub price: i128,
    pub category: u32,
    /// 1: Active, 2: Sold, 3: Cancelled.
    pub status: u32,
    pub escrow_enabled: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ScholarshipProgram {
    pub id: u64,
    pub name: String,
    pub amount: i128,
    pub sponsor: Address,
    pub university_code: String,
    pub min_gpa: u32,
    pub active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ScholarshipApplication {
    pub id: u64,
    pub program_id: u64,
    pub applicant: Address,
    pub university_code: String,
    pub gpa: u32,
    /// 0: Applied, 2: Approved, 3: Rejected, 4: Disbursed.
    pub status: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UtilityReward {
    pub id: u64,
    pub merchant: Address,
    pub university_code: String,
    pub name: String,
    pub cost_camp: i128,
    pub stock: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RedemptionRecord {
    pub id: u64,
    pub student: Address,
    pub merchant: Address,
    pub reward_id: u64,
    pub code: u64,
    /// 1: Redeemed, 2: Fulfilled.
    pub status: u32,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum FoodOrderStatus {
    Placed = 1,
    Preparing = 2,
    ReadyForPickup = 3,
    Completed = 4,
    Cancelled = 5,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MenuItem {
    pub id: u64,
    pub merchant: Address,
    pub university_code: String,
    pub name: String,
    pub description: String,
    pub price_camp: i128,
    pub available: bool,
    pub created_at: u64,
    pub updated_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FoodOrder {
    pub id: u64,
    pub merchant: Address,
    pub student: Address,
    pub university_code: String,
    pub menu_item_id: u64,
    pub quantity: u32,
    pub unit_price_camp: i128,
    pub total_camp: i128,
    pub status: FoodOrderStatus,
    pub placed_at: u64,
    pub updated_at: u64,
}

const FAUCET_AMOUNT: i128 = 100_000_0000;
const PURCHASE_RATE: i128 = 100;
const PURCHASE_MIN_XLM: i128 = 1_000_0000;
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

fn identity_client(env: &Env) -> Result<CampusIdentityClient<'_>, Error> {
    Ok(CampusIdentityClient::new(
        env,
        &get_address(env, DataKey::IdentityContract)?,
    ))
}

fn token_client(env: &Env) -> Result<CampusTokenClient<'_>, Error> {
    Ok(CampusTokenClient::new(
        env,
        &get_address(env, DataKey::TokenContract)?,
    ))
}

fn active_code(env: &Env, address: &Address) -> Result<String, Error> {
    match identity_client(env)?.try_active_university_code(address) {
        Ok(Ok(code)) => Ok(code),
        _ => Err(Error::IdentityCheckFailed),
    }
}

fn assert_active_role(env: &Env, address: &Address, role: IdentityUserRole) -> Result<(), Error> {
    if matches!(
        identity_client(env)?.try_assert_active_role(address, &role),
        Ok(Ok(_))
    ) {
        Ok(())
    } else {
        Err(Error::IdentityCheckFailed)
    }
}

fn assert_active_any_lister(env: &Env, address: &Address) -> Result<(), Error> {
    let student = assert_active_role(env, address, IdentityUserRole::Student).is_ok();
    let merchant = assert_active_role(env, address, IdentityUserRole::Merchant).is_ok();
    if student || merchant {
        Ok(())
    } else {
        Err(Error::IdentityCheckFailed)
    }
}

fn assert_same_university(env: &Env, left: &Address, right: &Address) -> Result<(), Error> {
    if matches!(
        identity_client(env)?.try_assert_active_same_university(left, right),
        Ok(Ok(()))
    ) {
        Ok(())
    } else {
        Err(Error::IdentityCheckFailed)
    }
}

fn assert_university_admin(env: &Env, address: &Address, code: &String) -> Result<(), Error> {
    if matches!(
        identity_client(env)?.try_assert_active_university_admin(address, code),
        Ok(Ok(_))
    ) {
        Ok(())
    } else {
        Err(Error::IdentityCheckFailed)
    }
}

fn assert_food_merchant(env: &Env, merchant: &Address) -> Result<(), Error> {
    if matches!(
        identity_client(env)?.try_assert_active_food_merchant(merchant),
        Ok(Ok(_))
    ) {
        Ok(())
    } else {
        Err(Error::IdentityCheckFailed)
    }
}

fn next_id(env: &Env, key: DataKey) -> u64 {
    let next = env
        .storage()
        .instance()
        .get::<DataKey, u64>(&key)
        .unwrap_or(0)
        + 1;
    env.storage().instance().set(&key, &next);
    extend_instance(env);
    next
}

fn require_platform_admin(env: &Env) -> Result<Address, Error> {
    let admin = get_address(env, DataKey::PlatformAdmin)?;
    admin.require_auth();
    Ok(admin)
}

#[contract]
pub struct CampusService;

#[contractimpl]
impl CampusService {
    pub fn initialize(
        env: Env,
        platform_admin: Address,
        token_contract: Address,
        identity_contract: Address,
        native_token_contract: Address,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::PlatformAdmin) {
            return Err(Error::AlreadyInitialized);
        }
        platform_admin.require_auth();
        let identity = CampusIdentityClient::new(&env, &identity_contract);
        if !matches!(identity.try_platform_admin(), Ok(Ok(admin)) if admin == platform_admin) {
            return Err(Error::Unauthorized);
        }
        let token = CampusTokenClient::new(&env, &token_contract);
        if !matches!(token.try_platform_admin(), Ok(Ok(admin)) if admin == platform_admin) {
            return Err(Error::Unauthorized);
        }
        env.storage()
            .instance()
            .set(&DataKey::PlatformAdmin, &platform_admin);
        env.storage()
            .instance()
            .set(&DataKey::TokenContract, &token_contract);
        env.storage()
            .instance()
            .set(&DataKey::IdentityContract, &identity_contract);
        env.storage()
            .instance()
            .set(&DataKey::NativeTokenContract, &native_token_contract);
        extend_instance(&env);
        Ok(())
    }

    pub fn platform_admin(env: Env) -> Result<Address, Error> {
        get_address(&env, DataKey::PlatformAdmin)
    }

    pub fn token_contract(env: Env) -> Result<Address, Error> {
        get_address(&env, DataKey::TokenContract)
    }

    pub fn identity_contract(env: Env) -> Result<Address, Error> {
        get_address(&env, DataKey::IdentityContract)
    }

    pub fn native_token_contract(env: Env) -> Result<Address, Error> {
        get_address(&env, DataKey::NativeTokenContract)
    }

    // --- Escrow ---

    pub fn create_escrow(
        env: Env,
        buyer: Address,
        seller: Address,
        amount: i128,
    ) -> Result<u64, Error> {
        buyer.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        assert_same_university(&env, &buyer, &seller)?;
        let university_code = active_code(&env, &buyer)?;
        token_client(&env)?.transfer_from(
            &env.current_contract_address(),
            &buyer,
            &env.current_contract_address(),
            &amount,
        );
        let id = next_id(&env, DataKey::EscrowCounter);
        let key = DataKey::Escrow(id);
        env.storage().persistent().set(
            &key,
            &EscrowAgreement {
                id,
                buyer: buyer.clone(),
                seller: seller.clone(),
                university_code,
                amount,
                status: 1,
            },
        );
        extend_persistent(&env, &key);
        env.events().publish(
            (Symbol::new(&env, "escrow_created"), id, buyer, seller),
            amount,
        );
        Ok(id)
    }

    pub fn get_escrow(env: Env, id: u64) -> Result<EscrowAgreement, Error> {
        let key = DataKey::Escrow(id);
        extend_persistent(&env, &key);
        env.storage().persistent().get(&key).ok_or(Error::NotFound)
    }

    pub fn list_escrows(env: Env, start_after: u64, limit: u32) -> Vec<EscrowAgreement> {
        let upper = env
            .storage()
            .instance()
            .get::<DataKey, u64>(&DataKey::EscrowCounter)
            .unwrap_or(0);
        let mut records = Vec::new(&env);
        let mut id = start_after;
        while id < upper && records.len() < limit.min(50) {
            id += 1;
            if let Some(record) = env.storage().persistent().get(&DataKey::Escrow(id)) {
                records.push_back(record);
            }
        }
        records
    }

    pub fn release_escrow(env: Env, id: u64, caller: Address) -> Result<(), Error> {
        caller.require_auth();
        let key = DataKey::Escrow(id);
        let mut escrow: EscrowAgreement = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NotFound)?;
        if caller != escrow.buyer || escrow.status != 1 {
            return Err(Error::InvalidStatus);
        }
        assert_same_university(&env, &escrow.buyer, &escrow.seller)?;
        token_client(&env)?.transfer(
            &env.current_contract_address(),
            &escrow.seller,
            &escrow.amount,
        );
        escrow.status = 2;
        env.storage().persistent().set(&key, &escrow);
        extend_persistent(&env, &key);
        Ok(())
    }

    pub fn refund_escrow(env: Env, id: u64, caller: Address) -> Result<(), Error> {
        caller.require_auth();
        let key = DataKey::Escrow(id);
        let mut escrow: EscrowAgreement = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NotFound)?;
        if caller != escrow.seller || escrow.status != 1 {
            return Err(Error::InvalidStatus);
        }
        assert_same_university(&env, &escrow.buyer, &escrow.seller)?;
        token_client(&env)?.transfer(
            &env.current_contract_address(),
            &escrow.buyer,
            &escrow.amount,
        );
        escrow.status = 3;
        env.storage().persistent().set(&key, &escrow);
        extend_persistent(&env, &key);
        Ok(())
    }

    // --- Events ---

    pub fn create_event(env: Env, host: Address, price: i128, capacity: u32) -> Result<u64, Error> {
        host.require_auth();
        if price < 0 || capacity == 0 {
            return Err(Error::InvalidInput);
        }
        assert_active_role(&env, &host, IdentityUserRole::EventOrganizer)?;
        let id = next_id(&env, DataKey::EventCounter);
        let key = DataKey::Event(id);
        env.storage().persistent().set(
            &key,
            &EventDetails {
                id,
                host: host.clone(),
                university_code: active_code(&env, &host)?,
                price,
                capacity,
                tickets_sold: 0,
            },
        );
        extend_persistent(&env, &key);
        env.events()
            .publish((Symbol::new(&env, "event_created"), id, host), price);
        Ok(id)
    }

    pub fn get_event(env: Env, id: u64) -> Result<EventDetails, Error> {
        let key = DataKey::Event(id);
        extend_persistent(&env, &key);
        env.storage().persistent().get(&key).ok_or(Error::NotFound)
    }

    pub fn list_events(env: Env, start_after: u64, limit: u32) -> Vec<EventDetails> {
        let upper = env
            .storage()
            .instance()
            .get::<DataKey, u64>(&DataKey::EventCounter)
            .unwrap_or(0);
        let mut records = Vec::new(&env);
        let mut id = start_after;
        while id < upper && records.len() < limit.min(50) {
            id += 1;
            if let Some(record) = env.storage().persistent().get(&DataKey::Event(id)) {
                records.push_back(record);
            }
        }
        records
    }

    pub fn buy_ticket(env: Env, event_id: u64, buyer: Address) -> Result<u64, Error> {
        buyer.require_auth();
        let event_key = DataKey::Event(event_id);
        let mut event: EventDetails = env
            .storage()
            .persistent()
            .get(&event_key)
            .ok_or(Error::NotFound)?;
        if event.tickets_sold >= event.capacity {
            return Err(Error::CapacityReached);
        }
        assert_same_university(&env, &buyer, &event.host)?;
        if event.price > 0 {
            token_client(&env)?.transfer_from(
                &env.current_contract_address(),
                &buyer,
                &event.host,
                &event.price,
            );
        }
        event.tickets_sold += 1;
        env.storage().persistent().set(&event_key, &event);
        let id = next_id(&env, DataKey::TicketCounter);
        let ticket_key = DataKey::Ticket(id);
        env.storage().persistent().set(
            &ticket_key,
            &TicketDetails {
                id,
                event_id,
                owner: buyer.clone(),
                university_code: event.university_code,
                redeemed: false,
            },
        );
        extend_persistent(&env, &ticket_key);
        Ok(id)
    }

    pub fn get_ticket(env: Env, id: u64) -> Result<TicketDetails, Error> {
        let key = DataKey::Ticket(id);
        extend_persistent(&env, &key);
        env.storage().persistent().get(&key).ok_or(Error::NotFound)
    }

    pub fn redeem_ticket(env: Env, ticket_id: u64, host: Address) -> Result<(), Error> {
        host.require_auth();
        assert_active_role(&env, &host, IdentityUserRole::EventOrganizer)?;
        let ticket_key = DataKey::Ticket(ticket_id);
        let mut ticket: TicketDetails = env
            .storage()
            .persistent()
            .get(&ticket_key)
            .ok_or(Error::NotFound)?;
        let event: EventDetails = env
            .storage()
            .persistent()
            .get(&DataKey::Event(ticket.event_id))
            .ok_or(Error::NotFound)?;
        if ticket.redeemed
            || event.host != host
            || active_code(&env, &host)? != ticket.university_code
        {
            return Err(Error::InvalidStatus);
        }
        assert_same_university(&env, &host, &ticket.owner)?;
        ticket.redeemed = true;
        env.storage().persistent().set(&ticket_key, &ticket);
        extend_persistent(&env, &ticket_key);
        Ok(())
    }

    // --- Marketplace (both Student and Merchant roles may list) ---

    pub fn create_listing(
        env: Env,
        seller: Address,
        title: String,
        description: String,
        price: i128,
        category: u32,
        escrow_enabled: bool,
    ) -> Result<u64, Error> {
        seller.require_auth();
        if price <= 0 || category < 1 || category > 5 || title.len() == 0 {
            return Err(Error::InvalidInput);
        }
        assert_active_any_lister(&env, &seller)?;
        let id = next_id(&env, DataKey::ListingCounter);
        let key = DataKey::Listing(id);
        env.storage().persistent().set(
            &key,
            &MarketplaceListing {
                id,
                seller: seller.clone(),
                university_code: active_code(&env, &seller)?,
                title: title.clone(),
                description,
                price,
                category,
                status: 1,
                escrow_enabled,
            },
        );
        extend_persistent(&env, &key);
        env.events().publish(
            (Symbol::new(&env, "item_listed"), id, seller),
            (price, title),
        );
        Ok(id)
    }

    pub fn get_listing(env: Env, id: u64) -> Result<MarketplaceListing, Error> {
        let key = DataKey::Listing(id);
        extend_persistent(&env, &key);
        env.storage().persistent().get(&key).ok_or(Error::NotFound)
    }

    pub fn list_listings(env: Env, start_after: u64, limit: u32) -> Vec<MarketplaceListing> {
        let upper = env
            .storage()
            .instance()
            .get::<DataKey, u64>(&DataKey::ListingCounter)
            .unwrap_or(0);
        let mut records = Vec::new(&env);
        let mut id = start_after;
        while id < upper && records.len() < limit.min(50) {
            id += 1;
            if let Some(record) = env.storage().persistent().get(&DataKey::Listing(id)) {
                records.push_back(record);
            }
        }
        records
    }

    pub fn update_listing(
        env: Env,
        id: u64,
        seller: Address,
        new_price: i128,
        new_status: u32,
    ) -> Result<(), Error> {
        seller.require_auth();
        let key = DataKey::Listing(id);
        let mut listing: MarketplaceListing = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NotFound)?;
        if listing.seller != seller
            || listing.status != 1
            || new_price <= 0
            || (new_status != 1 && new_status != 3)
        {
            return Err(Error::InvalidStatus);
        }
        assert_active_any_lister(&env, &seller)?;
        if active_code(&env, &seller)? != listing.university_code {
            return Err(Error::IdentityCheckFailed);
        }
        listing.price = new_price;
        listing.status = new_status;
        env.storage().persistent().set(&key, &listing);
        extend_persistent(&env, &key);
        Ok(())
    }

    pub fn buy_listing(env: Env, id: u64, buyer: Address) -> Result<(), Error> {
        buyer.require_auth();
        let key = DataKey::Listing(id);
        let mut listing: MarketplaceListing = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NotFound)?;
        if listing.status != 1 {
            return Err(Error::InvalidStatus);
        }
        assert_same_university(&env, &buyer, &listing.seller)?;
        if listing.escrow_enabled {
            let escrow_id = Self::create_escrow(
                env.clone(),
                buyer.clone(),
                listing.seller.clone(),
                listing.price,
            )?;
            let escrow_key = DataKey::ListingEscrow(id);
            env.storage().persistent().set(&escrow_key, &escrow_id);
            extend_persistent(&env, &escrow_key);
        } else {
            token_client(&env)?.transfer_from(
                &env.current_contract_address(),
                &buyer,
                &listing.seller,
                &listing.price,
            );
        }
        listing.status = 2;
        env.storage().persistent().set(&key, &listing);
        extend_persistent(&env, &key);
        Ok(())
    }

    pub fn get_listing_escrow(env: Env, listing_id: u64) -> Option<u64> {
        let key = DataKey::ListingEscrow(listing_id);
        extend_persistent(&env, &key);
        env.storage().persistent().get(&key)
    }

    // --- Payments ---

    pub fn pay_camp(
        env: Env,
        sender: Address,
        recipient: Address,
        amount: i128,
    ) -> Result<(), Error> {
        sender.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        assert_same_university(&env, &sender, &recipient)?;
        token_client(&env)?.transfer_from(
            &env.current_contract_address(),
            &sender,
            &recipient,
            &amount,
        );
        Ok(())
    }

    pub fn pay_xlm(
        env: Env,
        sender: Address,
        recipient: Address,
        amount: i128,
    ) -> Result<(), Error> {
        sender.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        assert_same_university(&env, &sender, &recipient)?;
        let native = get_address(&env, DataKey::NativeTokenContract)?;
        soroban_sdk::token::Client::new(&env, &native).transfer_from(
            &env.current_contract_address(),
            &sender,
            &recipient,
            &amount,
        );
        Ok(())
    }

    pub fn claim_faucet(env: Env, recipient: Address) -> Result<(), Error> {
        recipient.require_auth();
        // Active code lookup is the profile/university verification guard.
        active_code(&env, &recipient)?;
        token_client(&env)?.mint_purchase(
            &env.current_contract_address(),
            &recipient,
            &FAUCET_AMOUNT,
        );
        Ok(())
    }

    pub fn buy_camp_tokens(env: Env, recipient: Address, xlm_amount: i128) -> Result<(), Error> {
        recipient.require_auth();
        if xlm_amount < PURCHASE_MIN_XLM {
            return Err(Error::InvalidAmount);
        }
        active_code(&env, &recipient)?;
        let native = get_address(&env, DataKey::NativeTokenContract)?;
        soroban_sdk::token::Client::new(&env, &native).transfer_from(
            &env.current_contract_address(),
            &recipient,
            &get_address(&env, DataKey::PlatformAdmin)?,
            &xlm_amount,
        );
        let camp_amount = xlm_amount
            .checked_mul(PURCHASE_RATE)
            .ok_or(Error::InvalidAmount)?;
        token_client(&env)?.mint_purchase(
            &env.current_contract_address(),
            &recipient,
            &camp_amount,
        );
        Ok(())
    }

    // --- Scholarships and merchant rewards are university-scoped too ---

    pub fn create_scholarship_program(
        env: Env,
        admin: Address,
        university_code: String,
        name: String,
        amount: i128,
        min_gpa: u32,
    ) -> Result<u64, Error> {
        admin.require_auth();
        if amount <= 0 || name.len() == 0 {
            return Err(Error::InvalidInput);
        }
        assert_university_admin(&env, &admin, &university_code)?;
        token_client(&env)?.transfer_from(
            &env.current_contract_address(),
            &admin,
            &env.current_contract_address(),
            &amount,
        );
        let id = next_id(&env, DataKey::ScholarshipProgramCounter);
        let key = DataKey::ScholarshipProgram(id);
        env.storage().persistent().set(
            &key,
            &ScholarshipProgram {
                id,
                name,
                amount,
                sponsor: admin,
                university_code,
                min_gpa,
                active: true,
            },
        );
        extend_persistent(&env, &key);
        Ok(id)
    }

    pub fn apply_for_scholarship(
        env: Env,
        applicant: Address,
        program_id: u64,
        gpa: u32,
    ) -> Result<u64, Error> {
        applicant.require_auth();
        let program: ScholarshipProgram = env
            .storage()
            .persistent()
            .get(&DataKey::ScholarshipProgram(program_id))
            .ok_or(Error::NotFound)?;
        if !program.active || gpa < program.min_gpa {
            return Err(Error::InvalidStatus);
        }
        assert_active_role(&env, &applicant, IdentityUserRole::Student)?;
        assert_same_university(&env, &applicant, &program.sponsor)?;
        let id = next_id(&env, DataKey::ScholarshipApplicationCounter);
        let key = DataKey::ScholarshipApplication(id);
        env.storage().persistent().set(
            &key,
            &ScholarshipApplication {
                id,
                program_id,
                applicant,
                university_code: program.university_code,
                gpa,
                status: 0,
            },
        );
        extend_persistent(&env, &key);
        Ok(id)
    }

    pub fn review_scholarship_application(
        env: Env,
        admin: Address,
        application_id: u64,
        approved: bool,
    ) -> Result<(), Error> {
        admin.require_auth();
        let key = DataKey::ScholarshipApplication(application_id);
        let mut application: ScholarshipApplication = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NotFound)?;
        if application.status != 0 {
            return Err(Error::InvalidStatus);
        }
        assert_university_admin(&env, &admin, &application.university_code)?;
        application.status = if approved { 2 } else { 3 };
        env.storage().persistent().set(&key, &application);
        extend_persistent(&env, &key);
        Ok(())
    }

    pub fn disburse_scholarship(
        env: Env,
        admin: Address,
        application_id: u64,
    ) -> Result<(), Error> {
        admin.require_auth();
        let app_key = DataKey::ScholarshipApplication(application_id);
        let mut application: ScholarshipApplication = env
            .storage()
            .persistent()
            .get(&app_key)
            .ok_or(Error::NotFound)?;
        if application.status != 2 {
            return Err(Error::InvalidStatus);
        }
        assert_university_admin(&env, &admin, &application.university_code)?;
        let program_key = DataKey::ScholarshipProgram(application.program_id);
        let mut program: ScholarshipProgram = env
            .storage()
            .persistent()
            .get(&program_key)
            .ok_or(Error::NotFound)?;
        if !program.active || program.university_code != application.university_code {
            return Err(Error::InvalidStatus);
        }
        assert_same_university(&env, &program.sponsor, &application.applicant)?;
        token_client(&env)?.transfer(
            &env.current_contract_address(),
            &application.applicant,
            &program.amount,
        );
        application.status = 4;
        program.active = false;
        env.storage().persistent().set(&app_key, &application);
        env.storage().persistent().set(&program_key, &program);
        Ok(())
    }

    pub fn create_utility_reward(
        env: Env,
        merchant: Address,
        name: String,
        cost_camp: i128,
        stock: u32,
    ) -> Result<u64, Error> {
        merchant.require_auth();
        if name.len() == 0 || cost_camp <= 0 {
            return Err(Error::InvalidInput);
        }
        assert_active_role(&env, &merchant, IdentityUserRole::Merchant)?;
        let id = next_id(&env, DataKey::UtilityRewardCounter);
        let key = DataKey::UtilityReward(id);
        env.storage().persistent().set(
            &key,
            &UtilityReward {
                id,
                merchant: merchant.clone(),
                university_code: active_code(&env, &merchant)?,
                name,
                cost_camp,
                stock,
            },
        );
        extend_persistent(&env, &key);
        Ok(id)
    }

    pub fn redeem_reward(env: Env, student: Address, reward_id: u64) -> Result<u64, Error> {
        student.require_auth();
        let reward_key = DataKey::UtilityReward(reward_id);
        let mut reward: UtilityReward = env
            .storage()
            .persistent()
            .get(&reward_key)
            .ok_or(Error::NotFound)?;
        if reward.stock == 0 {
            return Err(Error::CapacityReached);
        }
        assert_active_role(&env, &student, IdentityUserRole::Student)?;
        assert_same_university(&env, &student, &reward.merchant)?;
        token_client(&env)?.transfer_from(
            &env.current_contract_address(),
            &student,
            &reward.merchant,
            &reward.cost_camp,
        );
        reward.stock -= 1;
        env.storage().persistent().set(&reward_key, &reward);
        let id = next_id(&env, DataKey::RedemptionCounter);
        let key = DataKey::Redemption(id);
        env.storage().persistent().set(
            &key,
            &RedemptionRecord {
                id,
                student,
                merchant: reward.merchant,
                reward_id,
                code: env.ledger().timestamp() + id,
                status: 1,
            },
        );
        extend_persistent(&env, &key);
        Ok(id)
    }

    pub fn fulfill_redemption(
        env: Env,
        merchant: Address,
        redemption_id: u64,
    ) -> Result<(), Error> {
        merchant.require_auth();
        let key = DataKey::Redemption(redemption_id);
        let mut redemption: RedemptionRecord = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NotFound)?;
        if redemption.status != 1 || redemption.merchant != merchant {
            return Err(Error::InvalidStatus);
        }
        assert_active_role(&env, &merchant, IdentityUserRole::Merchant)?;
        assert_same_university(&env, &merchant, &redemption.student)?;
        redemption.status = 2;
        env.storage().persistent().set(&key, &redemption);
        extend_persistent(&env, &key);
        Ok(())
    }

    // --- Food ordering ---

    pub fn publish_menu_item(
        env: Env,
        merchant: Address,
        name: String,
        description: String,
        price_camp: i128,
        available: bool,
    ) -> Result<u64, Error> {
        merchant.require_auth();
        if name.len() == 0 || price_camp <= 0 {
            return Err(Error::InvalidInput);
        }
        assert_food_merchant(&env, &merchant)?;
        let now = env.ledger().timestamp();
        let id = next_id(&env, DataKey::MenuItemCounter);
        let key = DataKey::MenuItem(id);
        env.storage().persistent().set(
            &key,
            &MenuItem {
                id,
                merchant: merchant.clone(),
                university_code: active_code(&env, &merchant)?,
                name,
                description,
                price_camp,
                available,
                created_at: now,
                updated_at: now,
            },
        );
        extend_persistent(&env, &key);
        env.events().publish(
            (Symbol::new(&env, "MenuItemPublished"), id, merchant),
            price_camp,
        );
        Ok(id)
    }

    pub fn update_menu_item(
        env: Env,
        merchant: Address,
        item_id: u64,
        name: String,
        description: String,
        price_camp: i128,
        available: bool,
    ) -> Result<(), Error> {
        merchant.require_auth();
        if name.len() == 0 || price_camp <= 0 {
            return Err(Error::InvalidInput);
        }
        let key = DataKey::MenuItem(item_id);
        let mut item: MenuItem = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NotFound)?;
        if item.merchant != merchant || active_code(&env, &merchant)? != item.university_code {
            return Err(Error::Unauthorized);
        }
        assert_food_merchant(&env, &merchant)?;
        item.name = name;
        item.description = description;
        item.price_camp = price_camp;
        item.available = available;
        item.updated_at = env.ledger().timestamp();
        env.storage().persistent().set(&key, &item);
        extend_persistent(&env, &key);
        Ok(())
    }

    pub fn get_menu_item(env: Env, item_id: u64) -> Result<MenuItem, Error> {
        let key = DataKey::MenuItem(item_id);
        extend_persistent(&env, &key);
        env.storage().persistent().get(&key).ok_or(Error::NotFound)
    }

    pub fn place_order(
        env: Env,
        student: Address,
        item_id: u64,
        quantity: u32,
    ) -> Result<u64, Error> {
        student.require_auth();
        if quantity == 0 {
            return Err(Error::InvalidInput);
        }
        assert_active_role(&env, &student, IdentityUserRole::Student)?;
        let item: MenuItem = env
            .storage()
            .persistent()
            .get(&DataKey::MenuItem(item_id))
            .ok_or(Error::NotFound)?;
        if !item.available {
            return Err(Error::InvalidStatus);
        }
        assert_food_merchant(&env, &item.merchant)?;
        assert_same_university(&env, &student, &item.merchant)?;
        let total_camp = item
            .price_camp
            .checked_mul(quantity as i128)
            .ok_or(Error::InvalidAmount)?;
        token_client(&env)?.transfer_from(
            &env.current_contract_address(),
            &student,
            &env.current_contract_address(),
            &total_camp,
        );
        let now = env.ledger().timestamp();
        let id = next_id(&env, DataKey::FoodOrderCounter);
        let key = DataKey::FoodOrder(id);
        env.storage().persistent().set(
            &key,
            &FoodOrder {
                id,
                merchant: item.merchant,
                student: student.clone(),
                university_code: item.university_code,
                menu_item_id: item_id,
                quantity,
                unit_price_camp: item.price_camp,
                total_camp,
                status: FoodOrderStatus::Placed,
                placed_at: now,
                updated_at: now,
            },
        );
        extend_persistent(&env, &key);
        env.events()
            .publish((Symbol::new(&env, "OrderPlaced"), id, student), total_camp);
        Ok(id)
    }

    pub fn update_order_status(
        env: Env,
        merchant: Address,
        order_id: u64,
        new_status: FoodOrderStatus,
    ) -> Result<(), Error> {
        merchant.require_auth();
        let key = DataKey::FoodOrder(order_id);
        let mut order: FoodOrder = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NotFound)?;
        if order.merchant != merchant {
            return Err(Error::Unauthorized);
        }
        assert_food_merchant(&env, &merchant)?;
        assert_same_university(&env, &merchant, &order.student)?;
        let valid = matches!(
            (order.status, new_status),
            (FoodOrderStatus::Placed, FoodOrderStatus::Preparing)
                | (FoodOrderStatus::Preparing, FoodOrderStatus::ReadyForPickup)
                | (FoodOrderStatus::ReadyForPickup, FoodOrderStatus::Completed)
        );
        if !valid {
            return Err(Error::InvalidStatus);
        }
        order.status = new_status;
        order.updated_at = env.ledger().timestamp();
        if new_status == FoodOrderStatus::Completed {
            token_client(&env)?.transfer(
                &env.current_contract_address(),
                &order.merchant,
                &order.total_camp,
            );
        }
        env.storage().persistent().set(&key, &order);
        extend_persistent(&env, &key);
        env.events().publish(
            (Symbol::new(&env, "OrderStatusChanged"), order_id, merchant),
            new_status,
        );
        Ok(())
    }

    pub fn cancel_order(env: Env, caller: Address, order_id: u64) -> Result<(), Error> {
        caller.require_auth();
        let key = DataKey::FoodOrder(order_id);
        let mut order: FoodOrder = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NotFound)?;
        let student_cancel = caller == order.student && order.status == FoodOrderStatus::Placed;
        let merchant_cancel = caller == order.merchant
            && (order.status == FoodOrderStatus::Placed
                || order.status == FoodOrderStatus::Preparing
                || order.status == FoodOrderStatus::ReadyForPickup);
        if !student_cancel && !merchant_cancel {
            return Err(Error::InvalidStatus);
        }
        assert_same_university(&env, &order.merchant, &order.student)?;
        if merchant_cancel {
            assert_food_merchant(&env, &caller)?;
        } else {
            assert_active_role(&env, &caller, IdentityUserRole::Student)?;
        }
        token_client(&env)?.transfer(
            &env.current_contract_address(),
            &order.student,
            &order.total_camp,
        );
        order.status = FoodOrderStatus::Cancelled;
        order.updated_at = env.ledger().timestamp();
        env.storage().persistent().set(&key, &order);
        extend_persistent(&env, &key);
        env.events().publish(
            (Symbol::new(&env, "OrderStatusChanged"), order_id, caller),
            FoodOrderStatus::Cancelled,
        );
        Ok(())
    }

    pub fn get_food_order(env: Env, order_id: u64) -> Result<FoodOrder, Error> {
        let key = DataKey::FoodOrder(order_id);
        extend_persistent(&env, &key);
        env.storage().persistent().get(&key).ok_or(Error::NotFound)
    }

    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) -> Result<(), Error> {
        require_platform_admin(&env)?;
        env.deployer().update_current_contract_wasm(new_wasm_hash);
        Ok(())
    }
}
