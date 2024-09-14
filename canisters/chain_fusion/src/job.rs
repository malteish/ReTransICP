use std::fmt;

use ethers_core::types::U256;
use evm_rpc_canister_types::LogEntry;

use crate::state::{mutate_state, LogSource};

pub async fn job(event_source: LogSource, event: LogEntry) {
    mutate_state(|s| s.record_processed_log(event_source.clone()));
    // because we deploy the canister with topics only matching
    // NewJob events we can safely assume that the event is a NewJob.

    let job_event = NewJobEvent::from(event);
    let job_id = job_event.job_id;
    let job_execution_time = job_event.job_execution_time;

    ic_cdk::println!("New job event: {job_event:?}");
    // for now, we don't check if the job is already in the queue. Logically, if it is, it should be with an
    // earlier execution time, so it's not a problem.
    mutate_state(|s| s.add_job(job_id, job_execution_time.as_u64()));
}

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct NewJobEvent {
    pub job_execution_time: U256,
    pub job_id: U256,
}

impl fmt::Debug for NewJobEvent {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("NewJobEvent")
            .field("job_id", &self.job_id)
            .finish()
    }
}

impl From<LogEntry> for NewJobEvent {
    fn from(entry: LogEntry) -> NewJobEvent {
        // we expect exactly 2 topics from the NewJob event.
        // you can read more about event signatures [here](https://docs.alchemy.com/docs/deep-dive-into-eth_getlogs#what-are-event-signatures)

        let job_id =
            U256::from_str_radix(&entry.topics[1], 16).expect("the job id should be valid");

        let job_execution_time =
            U256::from_str_radix(&entry.data, 16).expect("the execution time should be valid");

        NewJobEvent {
            job_execution_time,
            job_id,
        }
    }
}
