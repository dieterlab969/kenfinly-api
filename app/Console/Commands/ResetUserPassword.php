<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class ResetUserPassword extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:reset-password
                            {--email= : The email address of the user}
                            {--password= : The new password to set}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset a user\'s password using their email address';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle(): int
    {
        $email = $this->option('email');
        $password = $this->option('password');

        if (!$email || !$password) {
            $this->error('Both --email and --password options are required.');
            return Command::FAILURE;
        }

        $validator = Validator::make(
            ['email' => $email, 'password' => $password],
            [
                'email' => 'required|email',
                'password' => 'required|min:8',
            ]
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            return Command::FAILURE;
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email '{$email}' not found.");
            return Command::FAILURE;
        }

        $user->password = Hash::make($password);
        $user->save();

        $this->info("Password successfully reset for user: {$user->email}");
        $this->info("User ID: {$user->id}");
        $this->info("Name: {$user->name}");

        return Command::SUCCESS;
    }
}
