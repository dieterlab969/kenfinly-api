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
    }

    stages {
        stage('Checkout') {
            when {
                branch 'staging'
            }
            steps {
                checkout scm
            }
        }

        stage('Deploy') {
            when {
                branch 'staging'
            }
            steps {
                sh 'sudo -u sysuser /var/www/kenfinly/deploy/staging-deploy.sh'
            }
        }

        stage('Health Check') {
            when {
                branch 'staging'
            }
            steps {
                sh 'curl --fail --silent --show-error --max-time 10 http://127.0.0.1/up'
            }
        }
    }

    post {
        unsuccessful {
            echo 'Staging deployment failed. Check Jenkins logs and Laravel logs on the server.'
        }
    }
}
