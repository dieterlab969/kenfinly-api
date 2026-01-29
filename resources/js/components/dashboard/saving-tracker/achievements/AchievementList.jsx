import React from "react";
import { Award } from "lucide-react";
import AchievementItem from "./AchievementItem";
import { useTranslation } from "../../../../contexts/TranslationContext";

const AchievementList = ({ achievements }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Award size={20} className="mr-2 text-green-600" />
                {t('saving_tracker.achievements.title')}
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
                    {t('saving_tracker.achievements.empty')}
                </p>
            )}
        </div>
    );
};

export default AchievementList;
