"use client";

import React from "react";

interface ProgressIndicatorProps {
    step: number;
}

const StepBubble = ({ currentStep, stepNumber, label, showLine = true }: { currentStep: number; stepNumber: number; label: string; showLine?: boolean }) => {
    const isActive = currentStep >= stepNumber;
    return (
        <>
            <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isActive ? 'bg-[#74C00F] text-white' : 'bg-gray-300 text-gray-500'}`}>
                    {stepNumber}
                </div>
                <span className={`font-semibold hidden sm:inline ${isActive ? 'text-black' : 'text-gray-400'}`}>
                    {label}
                </span>
            </div>
            {showLine && (
                <div className={`flex-1 h-0.5 mx-2 ${currentStep > stepNumber ? 'bg-[#74C00F]' : 'bg-gray-300'}`}></div>
            )}
        </>
    );
};

export const ProgressIndicator = ({ step }: ProgressIndicatorProps) => {
    return (
        <div className="max-w-6xl mx-auto px-4 mt-8">
            <div className="flex items-center justify-between mb-8">
                <StepBubble currentStep={step} stepNumber={1} label="Select Tour" />
                <StepBubble currentStep={step} stepNumber={2} label="Guest Info" />
                <StepBubble currentStep={step} stepNumber={3} label="Payment" showLine={false} />
            </div>
        </div>
    );
};
