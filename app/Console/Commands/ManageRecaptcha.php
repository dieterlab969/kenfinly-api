<?php

namespace App\Console\Commands;

use App\Models\AppSetting;
use Illuminate\Console\Command;

class ManageRecaptcha extends Command
{
    protected $signature = 'recaptcha {action : The action to perform (status|enable|disable)}';

    protected $description = 'Manage Google reCAPTCHA v3 configuration for login and registration forms';

    public function handle()
    {
        $action = $this->argument('action');

        switch ($action) {
            case 'status':
                $this->showStatus();
                break;
            case 'enable':
                $this->enableRecaptcha();
                break;
            case 'disable':
                $this->disableRecaptcha();
                break;
            default:
                $this->error("Invalid action: {$action}");
                $this->info('Valid actions are: status, enable, disable');
                return 1;
        }

        return 0;
    }

    private function showStatus()
    {
        $enabled = AppSetting::isRecaptchaEnabled();
        $status = $enabled ? 'ENABLED' : 'DISABLED';
        
        $this->info("reCAPTCHA is currently {$status}");
        
        if ($enabled) {
            $this->line('Login and registration forms are protected with Google reCAPTCHA v3.');
        } else {
            $this->line('Login and registration forms are not using reCAPTCHA protection.');
        }
    }

    private function enableRecaptcha()
    {
        AppSetting::set('recaptcha_enabled', true, 'boolean');
        $this->info('reCAPTCHA has been ENABLED successfully.');
        $this->line('Login and registration forms will now use Google reCAPTCHA v3 protection.');
    }

    private function disableRecaptcha()
    {
        AppSetting::set('recaptcha_enabled', false, 'boolean');
        $this->info('reCAPTCHA has been DISABLED successfully.');
        $this->line('Login and registration forms will no longer use reCAPTCHA protection.');
    }
}
