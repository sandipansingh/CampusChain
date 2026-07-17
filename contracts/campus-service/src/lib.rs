#![no_std]
mod token_wasm {
    soroban_sdk::contractimport!(file = "wasm/campus_token.wasm");
}
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, BytesN, Env, String, Symbol, Vec,
};
use token_wasm::Client as CampusTokenClient;

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
    UniversityNotFound = 11,
    JoinRequestNotFound = 12,
    AlreadyMember = 13,
    NotAMember = 14,
    AlreadyClaimed = 15,
    ContractError = 16,
    InvalidAmount = 17,
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
    UniversityCounter,
    University(u64),
    UniversityMember(Address),
    JoinRequestCounter,
    JoinRequest(u64),
    InviteCounter,
    Invite(u64),
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

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct University {
    pub id: u64,
    pub name: String,
    pub location: String,
    pub description: String,
    pub admin: Address,
    pub member_count: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct JoinRequest {
    pub id: u64,
    pub university_id: u64,
    pub applicant: Address,
    pub status: u32, // 0: pending, 1: approved, 2: denied
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Invite {
    pub id: u64,
    pub university_id: u64,
    pub invitee: Address,
    pub status: u32, // 0: pending, 1: accepted, 2: declined
}

const FAUCET_AMOUNT: i128 = 100_000_0000; // 100 CAMP (7 decimals)
const PURCHASE_RATE: i128 = 100; // 1 XLM = 100 CAMP (i.e. multiply XLM stroops by 100 to get CAMP stroops)
const PURCHASE_MIN_XLM: i128 = 1_000_0000; // 1 XLM minimum purchase

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
        env.storage().persistent().extend_ttl(
            key,
            LEDGER_THRESHOLD_PERSISTENT,
            LEDGER_EXTEND_TO_PERSISTENT,
        );
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
        let mut counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::EscrowCounter)
            .unwrap_or(0);
        counter += 1;
        env.storage()
            .instance()
            .set(&DataKey::EscrowCounter, &counter);

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
            (
                Symbol::new(&env, "escrow_released"),
                id,
                escrow.buyer,
                escrow.seller,
            ),
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
            (
                Symbol::new(&env, "escrow_refunded"),
                id,
                escrow.buyer,
                escrow.seller,
            ),
            escrow.amount,
        );

        Ok(())
    }

    // --- TICKETING OPERATIONS ---

    pub fn create_event(env: Env, host: Address, price: i128, capacity: u32) -> Result<u64, Error> {
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
        let mut counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::EventCounter)
            .unwrap_or(0);
        counter += 1;
        env.storage()
            .instance()
            .set(&DataKey::EventCounter, &counter);

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
            (
                Symbol::new(&env, "ticket_bought"),
                ticket_counter,
                event_id,
                buyer,
            ),
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
            (
                Symbol::new(&env, "ticket_redeemed"),
                ticket_id,
                ticket.event_id,
                host,
            ),
            (),
        );

        Ok(())
    }

    // --- UNIVERSITY OPERATIONS ---

    pub fn register_university(
        env: Env,
        admin: Address,
        name: String,
        location: String,
        description: String,
    ) -> Result<u64, Error> {
        admin.require_auth();

        let token_addr = get_token_contract(&env)?;
        let token_client = CampusTokenClient::new(&env, &token_addr);

        // Require role 4 (University Admin)
        let role = token_client.get_role(&admin);
        if role != 4 {
            return Err(Error::Unauthorized);
        }

        extend_instance(&env);
        let mut counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::UniversityCounter)
            .unwrap_or(0);
        counter += 1;
        env.storage()
            .instance()
            .set(&DataKey::UniversityCounter, &counter);

        let university = University {
            id: counter,
            name,
            location,
            description,
            admin: admin.clone(),
            member_count: 0,
        };

        let key = DataKey::University(counter);
        env.storage().persistent().set(&key, &university);
        extend_persistent(&env, &key);

        env.events().publish(
            (Symbol::new(&env, "university_registered"), counter, admin),
            (),
        );

        Ok(counter)
    }

    pub fn get_university(env: Env, id: u64) -> Result<University, Error> {
        let key = DataKey::University(id);
        extend_persistent(&env, &key);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(Error::UniversityNotFound)
    }

    pub fn list_universities(env: Env) -> Result<Vec<University>, Error> {
        extend_instance(&env);
        let counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::UniversityCounter)
            .unwrap_or(0);

        let mut universities = Vec::new(&env);
        for id in 1..=counter {
            let key = DataKey::University(id);
            if let Some(uni) = env.storage().persistent().get::<DataKey, University>(&key) {
                universities.push_back(uni);
            }
        }
        Ok(universities)
    }

    // --- MEMBERSHIP OPERATIONS ---

    pub fn request_join(env: Env, university_id: u64, applicant: Address) -> Result<u64, Error> {
        applicant.require_auth();

        // Verify university exists
        let uni_key = DataKey::University(university_id);
        extend_persistent(&env, &uni_key);
        if !env.storage().persistent().has(&uni_key) {
            return Err(Error::UniversityNotFound);
        }

        // Check not already a member
        let member_key = DataKey::UniversityMember(applicant.clone());
        if env.storage().persistent().has(&member_key) {
            return Err(Error::AlreadyMember);
        }

        extend_instance(&env);
        let mut counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::JoinRequestCounter)
            .unwrap_or(0);
        counter += 1;
        env.storage()
            .instance()
            .set(&DataKey::JoinRequestCounter, &counter);

        let request = JoinRequest {
            id: counter,
            university_id,
            applicant: applicant.clone(),
            status: 0, // pending
        };

        let key = DataKey::JoinRequest(counter);
        env.storage().persistent().set(&key, &request);
        extend_persistent(&env, &key);

        env.events().publish(
            (
                Symbol::new(&env, "join_requested"),
                counter,
                university_id,
                applicant,
            ),
            (),
        );

        Ok(counter)
    }

    pub fn approve_member(env: Env, request_id: u64, admin: Address) -> Result<(), Error> {
        admin.require_auth();

        let req_key = DataKey::JoinRequest(request_id);
        extend_persistent(&env, &req_key);

        let mut request: JoinRequest = env
            .storage()
            .persistent()
            .get(&req_key)
            .ok_or(Error::JoinRequestNotFound)?;

        if request.status != 0 {
            return Err(Error::JoinRequestNotFound);
        }

        // Verify caller is the university admin
        let uni_key = DataKey::University(request.university_id);
        let university: University = env
            .storage()
            .persistent()
            .get(&uni_key)
            .ok_or(Error::UniversityNotFound)?;

        if university.admin != admin {
            return Err(Error::Unauthorized);
        }

        // Approve and assign member
        request.status = 1;
        env.storage().persistent().set(&req_key, &request);

        let member_key = DataKey::UniversityMember(request.applicant.clone());
        env.storage()
            .persistent()
            .set(&member_key, &request.university_id);
        extend_persistent(&env, &member_key);

        // Increment university member count
        let mut uni = university;
        uni.member_count += 1;
        env.storage().persistent().set(&uni_key, &uni);

        env.events().publish(
            (
                Symbol::new(&env, "member_approved"),
                request_id,
                request.applicant,
            ),
            request.university_id,
        );

        Ok(())
    }

    pub fn deny_member(env: Env, request_id: u64, admin: Address) -> Result<(), Error> {
        admin.require_auth();

        let req_key = DataKey::JoinRequest(request_id);
        extend_persistent(&env, &req_key);

        let mut request: JoinRequest = env
            .storage()
            .persistent()
            .get(&req_key)
            .ok_or(Error::JoinRequestNotFound)?;

        let uni_key = DataKey::University(request.university_id);
        let university: University = env
            .storage()
            .persistent()
            .get(&uni_key)
            .ok_or(Error::UniversityNotFound)?;

        if university.admin != admin {
            return Err(Error::Unauthorized);
        }

        request.status = 2;
        env.storage().persistent().set(&req_key, &request);

        Ok(())
    }

    pub fn get_join_request(env: Env, id: u64) -> Result<JoinRequest, Error> {
        let key = DataKey::JoinRequest(id);
        extend_persistent(&env, &key);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(Error::JoinRequestNotFound)
    }

    pub fn invite_member(
        env: Env,
        university_id: u64,
        invitee: Address,
        admin: Address,
    ) -> Result<u64, Error> {
        admin.require_auth();

        let uni_key = DataKey::University(university_id);
        let university: University = env
            .storage()
            .persistent()
            .get(&uni_key)
            .ok_or(Error::UniversityNotFound)?;

        if university.admin != admin {
            return Err(Error::Unauthorized);
        }

        extend_instance(&env);
        let mut counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::InviteCounter)
            .unwrap_or(0);
        counter += 1;
        env.storage()
            .instance()
            .set(&DataKey::InviteCounter, &counter);

        let invite = Invite {
            id: counter,
            university_id,
            invitee: invitee.clone(),
            status: 0,
        };

        let key = DataKey::Invite(counter);
        env.storage().persistent().set(&key, &invite);
        extend_persistent(&env, &key);

        env.events().publish(
            (
                Symbol::new(&env, "member_invited"),
                counter,
                university_id,
                invitee,
            ),
            (),
        );

        Ok(counter)
    }

    pub fn accept_invite(env: Env, invite_id: u64, invitee: Address) -> Result<(), Error> {
        invitee.require_auth();

        let inv_key = DataKey::Invite(invite_id);
        extend_persistent(&env, &inv_key);

        let mut invite: Invite = env
            .storage()
            .persistent()
            .get(&inv_key)
            .ok_or(Error::JoinRequestNotFound)?;

        if invite.invitee != invitee {
            return Err(Error::Unauthorized);
        }
        if invite.status != 0 {
            return Err(Error::JoinRequestNotFound);
        }

        let member_key = DataKey::UniversityMember(invitee.clone());
        if env.storage().persistent().has(&member_key) {
            return Err(Error::AlreadyMember);
        }

        invite.status = 1;
        env.storage().persistent().set(&inv_key, &invite);

        env.storage()
            .persistent()
            .set(&member_key, &invite.university_id);
        extend_persistent(&env, &member_key);

        let uni_key = DataKey::University(invite.university_id);
        let mut university: University = env
            .storage()
            .persistent()
            .get(&uni_key)
            .ok_or(Error::UniversityNotFound)?;
        university.member_count += 1;
        env.storage().persistent().set(&uni_key, &university);

        env.events().publish(
            (Symbol::new(&env, "invite_accepted"), invite_id, invitee),
            invite.university_id,
        );

        Ok(())
    }

    pub fn leave_university(env: Env, member: Address) -> Result<(), Error> {
        member.require_auth();

        let member_key = DataKey::UniversityMember(member.clone());
        if !env.storage().persistent().has(&member_key) {
            return Err(Error::NotAMember);
        }

        env.storage().persistent().remove(&member_key);

        env.events()
            .publish((Symbol::new(&env, "member_left"), member), ());

        Ok(())
    }

    pub fn list_pending_requests(env: Env, university_id: u64) -> Result<Vec<JoinRequest>, Error> {
        extend_instance(&env);
        let counter: u64 = env
            .storage()
            .instance()
            .get(&DataKey::JoinRequestCounter)
            .unwrap_or(0);

        let mut requests = Vec::new(&env);
        for id in 1..=counter {
            let key = DataKey::JoinRequest(id);
            if let Some(req) = env.storage().persistent().get::<DataKey, JoinRequest>(&key) {
                if req.university_id == university_id && req.status == 0 {
                    requests.push_back(req);
                }
            }
        }
        Ok(requests)
    }

    pub fn get_membership(env: Env, member: Address) -> Result<u64, Error> {
        let key = DataKey::UniversityMember(member);
        extend_persistent(&env, &key);
        env.storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NotAMember)
    }

    // --- TOKEN FAUCET ---

    pub fn has_claimed_faucet(env: Env, address: Address) -> bool {
        let token_addr = match get_token_contract(&env) {
            Ok(addr) => addr,
            Err(_) => return false,
        };
        let token_client = CampusTokenClient::new(&env, &token_addr);
        token_client.has_claimed_faucet(&address)
    }

    pub fn claim_faucet(env: Env, recipient: Address) -> Result<(), Error> {
        recipient.require_auth();

        let token_addr = get_token_contract(&env)?;
        let token_client = CampusTokenClient::new(&env, &token_addr);

        token_client.faucet(&recipient, &FAUCET_AMOUNT);

        env.events().publish(
            (Symbol::new(&env, "faucet_claimed"), recipient),
            FAUCET_AMOUNT,
        );

        Ok(())
    }

    pub fn buy_camp_tokens(env: Env, recipient: Address, xlm_amount: i128) -> Result<(), Error> {
        recipient.require_auth();

        if xlm_amount < PURCHASE_MIN_XLM {
            return Err(Error::InvalidAmount);
        }

        // 1 XLM = 100 CAMP
        let camp_amount = xlm_amount
            .checked_mul(PURCHASE_RATE)
            .ok_or(Error::InvalidAmount)?;

        let token_addr = get_token_contract(&env)?;
        let token_client = CampusTokenClient::new(&env, &token_addr);

        token_client.mint_purchase(&recipient, &camp_amount);

        env.events().publish(
            (Symbol::new(&env, "purchase_camp"), recipient),
            (xlm_amount, camp_amount),
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
