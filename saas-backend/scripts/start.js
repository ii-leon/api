#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function checkPort(port) {
  try {
    const result = execSync(`netstat -an`, { encoding: 'utf-8' });
    return result.includes(`:${port}`);
  } catch {
    return false;
  }
}

async function checkDocker() {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function startWithDocker() {
  console.log('\n🐳 Starting services with Docker Compose...\n');
  const dockerCompose = spawn('docker-compose', ['up', '-d', 'db', 'redis'], {
    cwd: __dirname + '/..',
    stdio: 'inherit',
    shell: true,
  });

  return new Promise((resolve, reject) => {
    dockerCompose.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Docker services started successfully!');
        resolve(true);
      } else {
        console.error('\n❌ Failed to start Docker services');
        resolve(false);
      }
    });
    dockerCompose.on('error', (err) => {
      console.error('\n❌ Docker Compose error:', err.message);
      resolve(false);
    });
  });
}

async function waitForService(host, port, name, maxRetries = 30) {
  console.log(`⏳ Waiting for ${name} on ${host}:${port}...`);
  for (let i = 0; i < maxRetries; i++) {
    try {
      const net = require('net');
      await new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(1000);
        socket.once('connect', () => {
          socket.destroy();
          resolve();
        });
        socket.once('timeout', () => {
          socket.destroy();
          reject(new Error('timeout'));
        });
        socket.once('error', (err) => {
          socket.destroy();
          reject(err);
        });
        socket.connect(port, host);
      });
      console.log(`✅ ${name} is ready!`);
      return true;
    } catch {
      process.stdout.write('.');
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  console.log(`\n❌ ${name} did not become ready in time`);
  return false;
}

async function startNestJS() {
  console.log('\n🚀 Starting NestJS application...\n');
  const nest = spawn('npm', ['run', 'start:dev'], {
    cwd: __dirname + '/..',
    stdio: 'inherit',
    shell: true,
  });

  nest.on('error', (err) => {
    console.error('Failed to start NestJS:', err.message);
  });
}

async function main() {
  console.log('='.repeat(50));
  console.log('   AI SaaS Backend - Startup Configuration');
  console.log('='.repeat(50));

  const hasDocker = await checkDocker();
  const pgRunning = await checkPort(5432);
  const redisRunning = await checkPort(6379);

  console.log('\n📋 Current Status:');
  console.log(`   PostgreSQL (5432): ${pgRunning ? '✅ Running' : '❌ Not running'}`);
  console.log(`   Redis (6379):      ${redisRunning ? '✅ Running' : '❌ Not running'}`);
  console.log(`   Docker:            ${hasDocker ? '✅ Available' : '❌ Not installed'}`);

  if (pgRunning && redisRunning) {
    console.log('\n✅ All services are already running!');
    await startNestJS();
    rl.close();
    return;
  }

  console.log('\n📝 Choose how to start the services:\n');
  console.log('   1. Docker (recommended if Docker is installed)');
  console.log('   2. Local (connect to local PostgreSQL & Redis)');

  const choice = await question('\n Enter your choice (1 or 2): ');

  if (choice === '1') {
    if (!hasDocker) {
      console.log('\n❌ Docker is not installed. Please install Docker Desktop first.');
      console.log('   Download: https://www.docker.com/products/docker-desktop');
      rl.close();
      process.exit(1);
    }

    const started = await startWithDocker();
    if (started) {
      await waitForService('localhost', 5432, 'PostgreSQL');
      await waitForService('localhost', 6379, 'Redis');
    }
  } else if (choice === '2') {
    console.log('\n💻 Using local services...');
    console.log('   Make sure PostgreSQL and Redis are running on their default ports.');
    console.log('   Database: saas_db | User: postgres | Port: 5432');
    console.log('   Redis: localhost:6379\n');

    if (!pgRunning) {
      console.log('⚠️  Warning: PostgreSQL is not detected on port 5432');
    }
    if (!redisRunning) {
      console.log('⚠️  Warning: Redis is not detected on port 6379');
    }
  } else {
    console.log('\n❌ Invalid choice. Exiting.');
    rl.close();
    process.exit(1);
  }

  rl.close();
  await startNestJS();
}

main().catch((err) => {
  console.error('Startup error:', err);
  process.exit(1);
});
