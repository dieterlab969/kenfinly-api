module.exports = {
  apps: [
    {
      name: 'kenfinly-queue',
      cwd: '/var/www/kenfinly',
      script: 'artisan',
      interpreter: 'php',
      args: 'queue:work database --sleep=3 --tries=3 --timeout=90',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        APP_ENV: 'staging',
      },
    },
    {
      name: 'kenfinly-schedule',
      cwd: '/var/www/kenfinly',
      script: 'artisan',
      interpreter: 'php',
      args: 'schedule:work',
      instances: 1,
      autorestart: true,
      max_memory_restart: '256M',
      env: {
        APP_ENV: 'staging',
      },
    },
  ],
};
