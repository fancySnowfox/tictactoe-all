// PM2 Ecosystem Configuration for Kafka Tic-Tac-Toe
// Usage:
//   pm2 start ecosystem.config.cjs
//   pm2 save
//   pm2 startup
// Location: Place in project root directory

module.exports = {
  apps: [
    {
      name: 'tictactoe-backend',
      script: './backend/dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        KAFKA_BROKER: 'localhost:9092'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        KAFKA_BROKER: 'localhost:9092',
        LOG_LEVEL: 'info'
      },
      // Process management
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist'],
      
      // Logging
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Health check
      listen_timeout: 10000,
      kill_timeout: 5000,
      
      // Auto-restart
      max_restarts: 10,
      min_uptime: '10s',
      
      // Additional settings
      merge_logs: true,
      autorestart: true,
      exp_backoff_restart_delay: 100
    }
  ],
  
  // Deploy configuration for production
  deploy: {
    production: {
      user: 'deploy',
      host: 'yourdomain.com',
      ref: 'origin/main',
      repo: 'git@github.com:youruser/kafka-tictactoe.git',
      path: '/var/www/kafka-tictactoe',
      'post-deploy': 'npm install && npm run build:prod && pm2 reload ecosystem.config.cjs --env production',
      'pre-deploy-local': 'echo "Deploying to production"'
    }
  }
};
