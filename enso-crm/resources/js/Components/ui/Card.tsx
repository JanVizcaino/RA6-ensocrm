import React from "react";
interface CardProps {
    children: React.ReactNode;
    className?: string;
    noPadding?: boolean;
}
export const Card: React.FC<CardProps> = ({
    children,
    className = "",
    noPadding = false,
}) => {
    return (
        <div
            className={`bg-bg-card rounded-lg shadow-[0px_1px_3px_0px_rgba(0,0,0,0.25)] flex flex-col justify-start items-start ${noPadding ? "" : "px-5 py-3.5 gap-2"} ${className}`}
        >
            {children}
        </div>
    );
};
