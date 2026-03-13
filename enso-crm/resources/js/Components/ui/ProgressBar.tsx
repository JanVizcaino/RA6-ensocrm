import React, { useMemo } from "react";

interface ProgressBarProps {
    startDate: string | Date;
    endDate: string | Date;
    className?: string;
    leftLabel?: React.ReactNode;
    rightLabel?: React.ReactNode;
    showDefaultLabels?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    startDate,
    endDate,
    className = "",
    leftLabel,
    rightLabel,
    showDefaultLabels = false,
}) => {
    const progressData = useMemo(() => {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        const now = new Date().getTime();

        if (isNaN(start) || isNaN(end) || start > end) {
            return { percentage: 0, daysLeft: 0, status: "error" };
        }

        const totalDuration = end - start;
        const elapsed = now - start;

        let percentage = (elapsed / totalDuration) * 100;

        percentage = Math.min(Math.max(percentage, 0), 100);

        const msPerDay = 1000 * 60 * 60 * 24;
        const daysLeft = Math.ceil((end - now) / msPerDay);

        return { percentage, daysLeft };
    }, [startDate, endDate]);

    const displayLeftLabel =
        leftLabel ||
        (showDefaultLabels
            ? progressData.daysLeft > 0
                ? `${progressData.daysLeft} días restantes`
                : "Expirado"
            : null);
    const displayRightLabel =
        rightLabel ||
        (showDefaultLabels ? `${Math.round(progressData.percentage)}%` : null);

    return (
        <div
            className={`inline-flex flex-col justify-center items-start gap-2 w-full ${className}`}
        >
            {(displayLeftLabel || displayRightLabel) && (
                <div className="w-full flex justify-between items-center">
                    <div
                        className={`text-xs font-normal font-sans ${progressData.daysLeft < 30 && showDefaultLabels ? "text-state-warning" : "text-text-body"}`}
                    >
                        {displayLeftLabel}
                    </div>
                    <div className="text-xs font-normal font-sans text-text-body text-right">
                        {displayRightLabel}
                    </div>
                </div>
            )}

            <div className="w-full h-1 bg-border-line rounded-full overflow-hidden">
                <div
                    className="h-full bg-brand-primary transition-all duration-500 ease-out rounded-full"
                    style={{ width: `${progressData.percentage}%` }}
                />
            </div>
        </div>
    );
};
