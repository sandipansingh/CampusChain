#![no_std]
mod token_wasm {
    soroban_sdk::contractimport!(file = "wasm/campus_token.wasm");
}
use token_wasm::Client as CampusTokenClient;
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, BytesN, Env, Symbol,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    EscrowNotFound = 4,
    InvalidEscrowStatus = 5,
    EventNotFound = 6,
    EventFull = 7,
    TicketNotFound = 8,
    TicketAlreadyRedeemed = 9,
    TokenError = 10,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Admin,
    TokenContract,
    EscrowCounter,
    EventCounter,
    TicketCounter,
    Escrow(u64),
    Event(u64),
    Ticket(u64),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowAgreement {
    pub id: u64,
    pub buyer: Address,
    pub seller: Address,
    pub amount: i128,
    pub status: u32, // 1: Funded, 2: Completed, 3: Refunded
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EventDetails {
    pub id: u64,
    pub host: Address,
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
    pub redeemed: bool,
}

const LEDGER_THRESHOLD_INSTANCE: u32 = 1000;
const LEDGER_EXTEND_TO_INSTANCE: u32 = 10000;

const LEDGER_THRESHOLD_PERSISTENT: u32 = 1000;
const LEDGER_EXTEND_TO_PERSISTENT: u32 = 10000;

fn extend_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(LEDGER_THRESHOLD_INSTANCE, LEDGER_EXTEND_TO_INSTANCE);
}

fn extend_persistent(env: &Env, key: &DataKey) {
    if env.storage().persistent().has(key) {
        env.storage()
            .persistent()
            .extend_ttl(key, LEDGER_THRESHOLD_PERSISTENT, LEDGER_EXTEND_TO_PERSISTENT);
    }
}

fn get_admin(env: &Env) -> Result<Address, Error> {
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)
}

fn get_token_contract(env: &Env) -> Result<Address, Error> {
    env.storage()
        .instance()
        .get(&DataKey::TokenContract)
        .ok_or(Error::NotInitialized)
}

#[contract]
pub struct CampusService;

#[contractimpl]
impl CampusService {
    pub fn initialize(env: Env, admin: Address, token_contract: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::TokenContract, &token_contract);
        env.storage().instance().set(&DataKey::EscrowCounter, &0u64);
        env.storage().instance().set(&DataKey::EventCounter, &0u64);
        env.storage().instance().set(&DataKey::TicketCounter, &0u64);

        extend_instance(&env);

        Ok(())
    }

    pub fn admin(env: Env) -> Result<Address, Error> {
        extend_instance(&env);
        get_admin(&env)
    }

    pub fn token_contract(env: Env) -> Result<Address, Error> {
        extend_instance(&env);
        get_token_contract(&env)
    }

    // --- ESCROW OPERATIONS ---

    pub fn create_escrow(
        env: Env,
        buyer: Address,
        seller: Address,
        amount: i128,
    ) -> Result<u64, Error> {
        let token_addr = get_token_contract(&env)?;
        buyer.require_auth();

        if amount <= 0 {
            return Err(Error::TokenError);
        }

        // C2C transfer of buyer's tokens into this service contract address
        let token_client = CampusTokenClient::new(&env, &token_addr);
        token_client.transfer_from(
            &env.current_contract_address(),
            &buyer,
            &env.current_contract_address(),
            &amount,
        );

        // Increment counter
        extend_instance(&env);
        let mut counter: u64 = env.storage().instance().get(&DataKey::EscrowCounter).unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&DataKey::EscrowCounter, &counter);

        let escrow = EscrowAgreement {
            id: counter,
            buyer: buyer.clone(),
            seller: seller.clone(),
            amount,
            status: 1, // Funded
        };

        let key = DataKey::Escrow(counter);
        env.storage().persistent().set(&key, &escrow);
        extend_persistent(&env, &key);

        env.events().publish(
            (Symbol::new(&env, "escrow_created"), counter, buyer, seller),
            amount,
        );

        Ok(counter)
    }

    pub fn get_escrow(env: Env, id: u64) -> Result<EscrowAgreement, Error> {
        let key = DataKey::Escrow(id);
        extend_persistent(&env, &key);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(Error::EscrowNotFound)
    }

    pub fn release_escrow(env: Env, id: u64, caller: Address) -> Result<(), Error> {
        let key = DataKey::Escrow(id);
        extend_persistent(&env, &key);

        let mut escrow: EscrowAgreement = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::EscrowNotFound)?;

        if escrow.status != 1 {
            return Err(Error::InvalidEscrowStatus);
        }

        caller.require_auth();
        let admin = get_admin(&env)?;
        if caller != escrow.buyer && caller != admin {
            return Err(Error::Unauthorized);
        }

        let token_addr = get_token_contract(&env)?;
        let token_client = CampusTokenClient::new(&env, &token_addr);

        // Transfer funds from Escrow to Seller
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.seller,
            &escrow.amount,
        );

        escrow.status = 2; // Completed
        env.storage().persistent().set(&key, &escrow);

        env.events().publish(
            (Symbol::new(&env, "escrow_released"), id, escrow.buyer, escrow.seller),
            escrow.amount,
        );

        Ok(())
    }

    pub fn refund_escrow(env: Env, id: u64, caller: Address) -> Result<(), Error> {
        let key = DataKey::Escrow(id);
        extend_persistent(&env, &key);

        let mut escrow: EscrowAgreement = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::EscrowNotFound)?;

        if escrow.status != 1 {
            return Err(Error::InvalidEscrowStatus);
        }

        caller.require_auth();
        let admin = get_admin(&env)?;
        if caller != escrow.seller && caller != admin {
            return Err(Error::Unauthorized);
        }

        let token_addr = get_token_contract(&env)?;
        let token_client = CampusTokenClient::new(&env, &token_addr);

        // Transfer funds back to Buyer
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.buyer,
            &escrow.amount,
        );

        escrow.status = 3; // Refunded
        env.storage().persistent().set(&key, &escrow);

        env.events().publish(
            (Symbol::new(&env, "escrow_refunded"), id, escrow.buyer, escrow.seller),
            escrow.amount,
        );

        Ok(())
    }

    // --- TICKETING OPERATIONS ---

    pub fn create_event(
        env: Env,
        host: Address,
        price: i128,
        capacity: u32,
    ) -> Result<u64, Error> {
        host.require_auth();

        if price < 0 {
            return Err(Error::TokenError);
        }

        let token_addr = get_token_contract(&env)?;
        let token_client = CampusTokenClient::new(&env, &token_addr);

        // RBAC validation: Host must be Club (3) or Admin (4)
        let role = token_client.get_role(&host);
        if role != 3 && role != 4 {
            return Err(Error::Unauthorized);
        }

        extend_instance(&env);
        let mut counter: u64 = env.storage().instance().get(&DataKey::EventCounter).unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&DataKey::EventCounter, &counter);

        let event = EventDetails {
            id: counter,
            host: host.clone(),
            price,
            capacity,
            tickets_sold: 0,
        };

        let key = DataKey::Event(counter);
        env.storage().persistent().set(&key, &event);
        extend_persistent(&env, &key);

        env.events().publish(
            (Symbol::new(&env, "event_created"), counter, host),
            (price, capacity),
        );

        Ok(counter)
    }

    pub fn get_event(env: Env, id: u64) -> Result<EventDetails, Error> {
        let key = DataKey::Event(id);
        extend_persistent(&env, &key);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(Error::EventNotFound)
    }

    pub fn buy_ticket(env: Env, event_id: u64, buyer: Address) -> Result<u64, Error> {
        buyer.require_auth();

        let event_key = DataKey::Event(event_id);
        extend_persistent(&env, &event_key);

        let mut event: EventDetails = env
            .storage()
            .persistent()
            .get(&event_key)
            .ok_or(Error::EventNotFound)?;

        if event.tickets_sold >= event.capacity {
            return Err(Error::EventFull);
        }

        let token_addr = get_token_contract(&env)?;
        let token_client = CampusTokenClient::new(&env, &token_addr);

        // If price > 0, pay the host
        if event.price > 0 {
            token_client.transfer_from(
                &env.current_contract_address(),
                &buyer,
                &event.host,
                &event.price,
            );
        }

        // Increment ticket counter
        extend_instance(&env);
        let mut ticket_counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::TicketCounter)
            .unwrap_or(0);
        ticket_counter += 1;
        env.storage()
            .instance()
            .set(&DataKey::TicketCounter, &ticket_counter);

        // Store Ticket Details
        let ticket = TicketDetails {
            id: ticket_counter,
            event_id,
            owner: buyer.clone(),
            redeemed: false,
        };
        let ticket_key = DataKey::Ticket(ticket_counter);
        env.storage().persistent().set(&ticket_key, &ticket);
        extend_persistent(&env, &ticket_key);

        // Update Event tickets sold
        event.tickets_sold += 1;
        env.storage().persistent().set(&event_key, &event);

        env.events().publish(
            (Symbol::new(&env, "ticket_bought"), ticket_counter, event_id, buyer),
            event.price,
        );

        Ok(ticket_counter)
    }

    pub fn get_ticket(env: Env, id: u64) -> Result<TicketDetails, Error> {
        let key = DataKey::Ticket(id);
        extend_persistent(&env, &key);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(Error::TicketNotFound)
    }

    pub fn redeem_ticket(env: Env, ticket_id: u64, host: Address) -> Result<(), Error> {
        host.require_auth();

        let ticket_key = DataKey::Ticket(ticket_id);
        extend_persistent(&env, &ticket_key);

        let mut ticket: TicketDetails = env
            .storage()
            .persistent()
            .get(&ticket_key)
            .ok_or(Error::TicketNotFound)?;

        if ticket.redeemed {
            return Err(Error::TicketAlreadyRedeemed);
        }

        let event_key = DataKey::Event(ticket.event_id);
        extend_persistent(&env, &event_key);

        let event: EventDetails = env
            .storage()
            .persistent()
            .get(&event_key)
            .ok_or(Error::EventNotFound)?;

        if event.host != host {
            return Err(Error::Unauthorized);
        }

        ticket.redeemed = true;
        env.storage().persistent().set(&ticket_key, &ticket);

        env.events().publish(
            (Symbol::new(&env, "ticket_redeemed"), ticket_id, ticket.event_id, host),
            (),
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
