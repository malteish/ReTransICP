use candid::Nat;
use candid::{CandidType, Decode, Deserialize, Encode};
use ethers_core::types::U256;
use evm_rpc_canister_types::{BlockTag, LogEntry, RpcService, RpcServices};
use ic_cdk::api::management_canister::ecdsa::EcdsaKeyId;
use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet, HashSet};

thread_local! {
    static STATE: RefCell<Option<State>> = RefCell::default();
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, CandidType, Deserialize)]
pub struct U256Wrapper(pub String);

impl From<U256> for U256Wrapper {
    fn from(value: U256) -> Self {
        U256Wrapper(value.to_string())
    }
}

impl From<U256Wrapper> for U256 {
    fn from(wrapper: U256Wrapper) -> Self {
        U256::from_dec_str(&wrapper.0).unwrap()
    }
}

#[derive(Debug, Clone)]
pub struct State {
    pub rpc_services: RpcServices,
    pub rpc_service: RpcService,
    pub get_logs_addresses: Vec<String>,
    pub get_logs_topics: Option<Vec<Vec<String>>>,
    pub last_scraped_block_number: Nat,
    pub last_observed_block_number: Option<Nat>,
    pub logs_to_process: BTreeMap<LogSource, LogEntry>,
    pub processed_logs: BTreeMap<LogSource, LogEntry>,
    pub skipped_blocks: BTreeSet<Nat>,
    pub active_tasks: HashSet<TaskType>,
    pub ecdsa_pub_key: Option<Vec<u8>>,
    pub ecdsa_key_id: EcdsaKeyId,
    pub evm_address: Option<String>,
    pub nonce: U256,
    pub block_tag: BlockTag,
    pub job_execution_times: BTreeMap<U256Wrapper, u64>,
}

#[derive(Debug, Eq, PartialEq)]
pub enum InvalidStateError {
    InvalidEthereumContractAddress(String),
    InvalidTopic(String),
}

impl State {
    pub fn record_log_to_process(&mut self, log_entry: &LogEntry) {
        let event_source = log_entry.source();
        assert!(
            !self.logs_to_process.contains_key(&event_source),
            "there must be no two different events with the same source"
        );
        assert!(!self.processed_logs.contains_key(&event_source));

        self.logs_to_process.insert(event_source, log_entry.clone());
    }

    pub fn record_processed_log(&mut self, source: LogSource) {
        let log_entry = match self.logs_to_process.remove(&source) {
            Some(event) => event,
            None => panic!("attempted to run job for an unknown event {source:?}"),
        };

        assert_eq!(
            self.processed_logs.insert(source.clone(), log_entry),
            None,
            "attempted to run job twice for the same event {source:?}"
        );
    }

    pub fn record_skipped_block(&mut self, block_number: Nat) {
        assert!(
            self.skipped_blocks.insert(block_number.clone()),
            "BUG: block {} was already skipped",
            block_number
        );
    }

    pub fn has_logs_to_process(&self) -> bool {
        !self.logs_to_process.is_empty()
    }

    pub fn rpc_services(&self) -> RpcServices {
        self.rpc_services.clone()
    }

    pub fn key_id(&self) -> EcdsaKeyId {
        self.ecdsa_key_id.clone()
    }

    pub fn get_logs_addresses(&self) -> Vec<String> {
        self.get_logs_addresses.clone()
    }

    pub fn nonce(&self) -> U256 {
        self.nonce
    }

    pub fn add_job(&mut self, job_id: U256, execution_time: u64) {
        self.job_execution_times
            .insert(job_id.into(), execution_time);
    }

    pub fn remove_job(&mut self, job_id: &U256) -> Option<u64> {
        self.job_execution_times
            .remove(&U256Wrapper::from(job_id.clone()))
    }

    pub fn get_earliest_job(&self) -> Option<(U256, u64)> {
        self.job_execution_times
            .iter()
            .min_by_key(|(_, &execution_time)| execution_time)
            .map(|(job_id, execution_time)| (U256::from(job_id.clone()), *execution_time))
    }
}

trait IntoLogSource {
    fn source(&self) -> LogSource;
}

impl IntoLogSource for LogEntry {
    fn source(&self) -> LogSource {
        LogSource {
            transaction_hash: self
                .transactionHash
                .clone()
                .expect("for finalized blocks logs are not pending"),
            log_index: self
                .logIndex
                .clone()
                .expect("for finalized blocks logs are not pending"),
        }
    }
}

/// A unique identifier of the event source: the source transaction hash and the log
/// entry index.
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct LogSource {
    pub transaction_hash: String,
    pub log_index: Nat,
}

pub fn read_state<R>(f: impl FnOnce(&State) -> R) -> R {
    STATE.with_borrow(|s| f(s.as_ref().expect("BUG: state is not initialized")))
}

/// Mutates (part of) the current state using `f`.
///
/// Panics if there is no state.
pub fn mutate_state<F, R>(f: F) -> R
where
    F: FnOnce(&mut State) -> R,
{
    STATE.with_borrow_mut(|s| f(s.as_mut().expect("BUG: state is not initialized")))
}

/// Sets the current state to `state`.
pub fn initialize_state(state: State) {
    STATE.set(Some(state));
}

#[derive(Debug, Hash, Copy, Clone, PartialEq, Eq)]
pub enum TaskType {
    ProcessLogs,
    ScrapeLogs,
}

#[ic_cdk::pre_upgrade]
fn pre_upgrade() {
    let job_execution_times = read_state(|state| state.job_execution_times.clone());
    let last_scraped_block_number = read_state(|state| state.last_scraped_block_number.clone());
    let data = Encode!(&(job_execution_times, last_scraped_block_number)).unwrap();
    ic_cdk::storage::stable_save((data,)).unwrap();
}

#[ic_cdk::post_upgrade]
fn post_upgrade() {
    let (data,): (Vec<u8>,) = ic_cdk::storage::stable_restore().unwrap();
    let (job_execution_times, last_scraped_block_number): (BTreeMap<U256Wrapper, u64>, Nat) =
        Decode!(&data, (BTreeMap<U256Wrapper, u64>, Nat)).unwrap();

    mutate_state(|state| {
        state.job_execution_times = job_execution_times;
        state.last_scraped_block_number = last_scraped_block_number;
    });
}