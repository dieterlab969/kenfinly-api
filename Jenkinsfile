pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    triggers {
        githubPush()
    }

    environment {
        APP_DIR = '/var/www/kenfinly'
        DEPLOY_BRANCH = 'staging'
        SYS_USER = 'sysuser'  // user chạy các lệnh deploy
    }

    stages {
        stage('Checkout') {
            when {
                branch DEPLOY_BRANCH
            }
            steps {
                script {
                    echo "Starting checkout from branch ${DEPLOY_BRANCH}..."
                    dir(APP_DIR) {
                        // Pull latest code from staging branch
                        sh "sudo -u ${SYS_USER} git fetch origin ${DEPLOY_BRANCH}"
                        sh "sudo -u ${SYS_USER} git reset --hard origin/${DEPLOY_BRANCH}"
                        // Show last 5 commits for visibility
                        sh "sudo -u ${SYS_USER} git log -5 --oneline"
                    }
                    echo "Checkout completed successfully."
                }
            }
        }

        stage('Install Dependencies') {
            when {
                branch DEPLOY_BRANCH
            }
            steps {
                script {
                    echo "Installing PHP dependencies via Composer..."
                    dir(APP_DIR) {
                        sh "sudo -u ${SYS_USER} composer install --no-interaction --prefer-dist --optimize-autoloader"
                    }
                    echo "Composer dependencies installed successfully."
                }
            }
        }

        stage('Run Migrations') {
            when {
                branch DEPLOY_BRANCH
            }
            steps {
                script {
                    echo "Running database migrations (safe, non-destructive)..."
                    dir(APP_DIR) {
                        sh "sudo -u ${SYS_USER} php artisan migrate --force"
                    }
                    echo "Database migrations completed successfully."
                }
            }
        }

        stage('Build Assets') {
            when {
                branch DEPLOY_BRANCH
            }
            steps {
                script {
                    echo "Installing Node.js dependencies and building assets..."
                    dir(APP_DIR) {
                        sh "sudo -u ${SYS_USER} npm install"
                        sh "sudo -u ${SYS_USER} npm run prod"
                    }
                    echo "Asset build completed successfully."
                }
            }
        }

        stage('Clear Cache') {
            when {
                branch DEPLOY_BRANCH
            }
            steps {
                script {
                    echo "Clearing and caching Laravel config and routes..."
                    dir(APP_DIR) {
                        sh "sudo -u ${SYS_USER} php artisan config:cache"
                        sh "sudo -u ${SYS_USER} php artisan route:cache"
                        sh "sudo -u ${SYS_USER} php artisan view:cache"
                    }
                    echo "Laravel cache cleared and rebuilt successfully."
                }
            }
        }

        stage('Health Check') {
            when {
                branch DEPLOY_BRANCH
            }
            steps {
                script {
                    echo "Performing health check on application..."
                    sh 'curl --fail --silent --show-error --max-time 10 http://127.0.0.1/up'
                    echo "Health check passed successfully."
                }
            }
        }
    }

    post {
        unsuccessful {
            echo 'Staging deployment failed. Please check Jenkins logs and Laravel logs on the server.'
        }
    }
}
