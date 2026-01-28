<?php

namespace App\Services\SavingTracker;

use App\Models\Achievement;
use App\Models\Habit;
use App\Models\User;

class AchievementService
{
    protected array $achievementTypes = [
        'first_habit' => [
            'title' => 'First Step',
            'description' => 'Created your first saving habit',
            'icon' => 'star',
            'check' => 'checkFirstHabit',
        ],
        'streak_3' => [
            'title' => '3 Day Streak',
            'description' => 'Maintained a 3 day streak',
            'icon' => 'fire',
            'check' => 'checkStreak',
            'value' => 3,
        ],
        'streak_7' => [
            'title' => 'Week Warrior',
            'description' => 'Maintained a 7 day streak',
            'icon' => 'fire',
            'check' => 'checkStreak',
            'value' => 7,
        ],
        'streak_30' => [
            'title' => 'Monthly Master',
            'description' => 'Maintained a 30 day streak',
            'icon' => 'crown',
            'check' => 'checkStreak',
            'value' => 30,
        ],
        'saved_100' => [
            'title' => 'Saver Starter',
            'description' => 'Saved $100 total',
            'icon' => 'piggy-bank',
            'check' => 'checkTotalSaved',
            'value' => 100,
        ],
        'saved_500' => [
            'title' => 'Smart Saver',
            'description' => 'Saved $500 total',
            'icon' => 'piggy-bank',
            'check' => 'checkTotalSaved',
            'value' => 500,
        ],
        'saved_1000' => [
            'title' => 'Super Saver',
            'description' => 'Saved $1,000 total',
            'icon' => 'trophy',
            'check' => 'checkTotalSaved',
            'value' => 1000,
        ],
        'five_habits' => [
            'title' => 'Habit Builder',
            'description' => 'Created 5 saving habits',
            'icon' => 'medal',
            'check' => 'checkHabitCount',
            'value' => 5,
        ],
    ];

    public function checkAndAwardAchievements(Habit $habit, User $user): array
    {
        $awardedAchievements = [];

        foreach ($this->achievementTypes as $type => $config) {
            $existing = Achievement::where('user_id', $user->id)
                ->where('type', $type)
                ->whereNotNull('achieved_at')
                ->exists();

            if ($existing) {
                continue;
            }

            $method = $config['check'];
            $value = $config['value'] ?? null;
            $achieved = false;

            switch ($method) {
                case 'checkFirstHabit':
                    $achieved = $this->checkFirstHabit($user);
                    break;
                case 'checkStreak':
                    $achieved = $this->checkStreak($habit, $value);
                    break;
                case 'checkTotalSaved':
                    $achieved = $this->checkTotalSaved($user, $value);
                    break;
                case 'checkHabitCount':
                    $achieved = $this->checkHabitCount($user, $value);
                    break;
            }

            if ($achieved) {
                $achievement = Achievement::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'type' => $type,
                        'habit_id' => in_array($method, ['checkStreak']) ? $habit->id : null,
                    ],
                    [
                        'title' => $config['title'],
                        'description' => $config['description'],
                        'icon' => $config['icon'],
                        'achieved_at' => now(),
                    ]
                );
                $awardedAchievements[] = $achievement;
            }
        }

        return $awardedAchievements;
    }

    protected function checkFirstHabit(User $user): bool
    {
        return Habit::where('user_id', $user->id)->count() >= 1;
    }

    protected function checkStreak(Habit $habit, int $requiredStreak): bool
    {
        return $habit->current_streak >= $requiredStreak;
    }

    protected function checkTotalSaved(User $user, float $requiredAmount): bool
    {
        $totalSaved = Habit::where('user_id', $user->id)
            ->with('trackings')
            ->get()
            ->sum('total_saved');

        return $totalSaved >= $requiredAmount;
    }

    protected function checkHabitCount(User $user, int $requiredCount): bool
    {
        return Habit::where('user_id', $user->id)->count() >= $requiredCount;
    }

    public function getAchievementDefinitions(): array
    {
        return $this->achievementTypes;
    }
}
