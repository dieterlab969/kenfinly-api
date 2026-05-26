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
        SYS_USER = 'sysuser'
    }

    stages {
        stage('Verify Branch') {
            steps {
                script {
                    /*
                     * This job is a regular "Pipeline script from SCM" job, not a
                     * Multibranch Pipeline. In that mode Jenkins often does not set
                     * BRANCH_NAME, so declarative `when { branch 'staging' }` skips.
                     */
                    def detectedBranch = (env.BRANCH_NAME ?: env.GIT_BRANCH ?: '').trim()
                    detectedBranch = detectedBranch
                        .replaceFirst(/^origin\//, '')
                        .replaceFirst(/^refs\/heads\//, '')

                    if (detectedBranch && detectedBranch != env.DEPLOY_BRANCH) {
                        error "Refusing to deploy '${detectedBranch}'. Expected '${env.DEPLOY_BRANCH}'."
                    }

                    def branchMessage = detectedBranch
                        ? "Deploying branch '${detectedBranch}'."
                        : "No Jenkins branch variable was set; continuing because this job is configured to build '${env.DEPLOY_BRANCH}' only."

                    echo branchMessage
                }
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Deploy') {
            steps {
                sh "sudo -u ${SYS_USER} ${APP_DIR}/deploy/staging-deploy.sh"
            }
        }

        stage('Health Check') {
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
