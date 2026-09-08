import { retryQueue } from "./retry.queue.js";
const addJob = async () => {
    const job = await retryQueue.add(
        "retry-test", 
        {
            message: "This job will be retried on failure.",
        }, 
        {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 2000,
            },
        }
    );

    console.log("Job added:", job.id);        
    await retryQueue.close();

}

addJob();