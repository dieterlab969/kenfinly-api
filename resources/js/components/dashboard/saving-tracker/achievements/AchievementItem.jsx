import React from "react";

const AchievementItem = ({ achievement }) => {
    return (
        <div
            className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg flex items-center"
        >
            <span className="text-2xl mr-2">{achievement.icon}</span>
            <div>
                <h3 className="font-medium">{achievement.title}</h3>
                <p className="text-xs text-gray-600">{achievement.description}</p>
            </div>
        </div>
    );
};

export default AchievementItem;
