const cluster = require('cluster');
const app = require('./src/app');

const numCPUs = 2; // As per requirement, using 2 replica sets
const port = process.env.PORT || 3000;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Replace the dead worker
    cluster.fork();
  });
} else {
  // Workers share the TCP connection
  app.listen(port, () => {
    console.log(`Worker ${process.pid} started and listening on port ${port}`);
  });

  // Handle worker shutdown
  process.on('SIGTERM', () => {
    console.log(`Worker ${process.pid} shutting down...`);
    process.exit(0);
  });
}