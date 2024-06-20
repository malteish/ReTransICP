mod calculate_result;
mod run_job;

use std::fmt;

use ethers_core::types::U256;
use ic_cdk::println;
use run_job::run_job;

use crate::{
    evm_rpc::LogEntry,
    state::{mutate_state, LogSource},
};

pub async fn job(event_source: LogSource, event: LogEntry) {
    mutate_state(|s| s.record_processed_log(event_source.clone()));
    let job_event = NewJobEvent::from(event);
    let job_id = job_event.job_id;
    let job_sleep_interval = job_event.job_sleep_interval;

    ic_cdk::println!("Starting a periodic task with interval {job_sleep_interval:?}");
    ic_cdk_timers::set_timer(std::time::Duration::from_secs(job_sleep_interval.as_u64()), move || {
        ic_cdk::println!("Executing a periodic task {job_id:?}");
        ic_cdk::spawn(async move {
            run_job(job_id).await
        })
    });

    // Run job first time
    // run_job(job_id).await;
    println!("Successfully started timer for periodic task {job_id}");
}

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord)]
pub struct NewJobEvent {
    pub job_id: U256,
    pub job_sleep_interval: U256
}

impl fmt::Debug for NewJobEvent {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("NewJobEvent")
            .field("job_id", &self.job_id)
            .field("job_sleep_interval", &self.job_sleep_interval)
            .finish()
    }
}

impl From<LogEntry> for NewJobEvent {
    fn from(entry: LogEntry) -> NewJobEvent {
        // we expect exactly 2 topics from the NewJob event.
        // you can read more about event signatures [here](https://docs.alchemy.com/docs/deep-dive-into-eth_getlogs#what-are-event-signatures)
        let job_id =
            U256::from_str_radix(&entry.topics[1], 16).expect("job id should be valid");
        let job_sleep_interval = U256::from_str_radix(&entry.topics[2], 16).expect("job sleep interval should be valid");

        NewJobEvent { job_id, job_sleep_interval }
    }
}
