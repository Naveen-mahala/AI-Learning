"use client";

import React from "react";
import { cn } from "@/utils/cn";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-zinc-800/60 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent",
        className
      )}
      {...props}
    />
  );
};

export const LessonSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 w-full py-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/5" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    </div>
  );
};
