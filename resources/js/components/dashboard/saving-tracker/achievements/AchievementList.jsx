import React from "react";
import { Award } from "lucide-react";
import AchievementItem from "./AchievementItem";

const AchievementList = ({ achievements }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Award size={20} className="mr-2 text-green-600" />
                Achievements
            </h2>
            {achievements.length > 0 ? (
                <div className="space-y-3">
                    {achievements.map(achievement => (
                        <AchievementItem
                            key={achievement.id}
                            achievement={achievement}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-gray-500 text-sm">
                    Keep going! Complete your habits consistently to earn achievements.
                </p>
            )}
        </div>
    );
};

export default AchievementList;
