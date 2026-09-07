import { testQueue } from "./test.queue.js";

const addJob = async () => {
    const job = await testQueue.add("hello-job", {
        message: "Hello Redis!",
    });

    console.log("Job added:", job.id);

    await testQueue.close();
};

addJob();