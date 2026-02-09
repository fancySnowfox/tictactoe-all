module.exports = {
  apps: [
    {
      name: 'tictactoe-backend',
      script: './backend/src/server.ts',
      interpreter: 'npx ts-node',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        KAFKA_BROKER: process.env.KAFKA_BROKER || 'localhost:9092',
      },
      env_localhost: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
    {
      name: 'tictactoe-frontend',
      cwd: './frontend',
      script: 'vite',
      args: 'preview --port 5173',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
      error_file: '../logs/frontend-error.log',
      out_file: '../logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
  deploy: {
    production: {
      user: 'root',
      host: process.env.DEPLOY_HOST || 'your-droplet-ip',
      ref: 'origin/main',
      repo: 'https://github.com/fancySnowfox/kafka-tictactoe.git',
      path: '/var/www/tictactoe',
      'post-deploy': 'npm install && pm2 startOrRestart ecosystem.config.js --env production',
      'pre-deploy-local': 'echo "Deploying to production..."',
    },
  },
};
