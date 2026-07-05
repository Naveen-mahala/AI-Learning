"use client";

import React from "react";
import { getBezierPath, EdgeProps } from "@xyflow/react";

export const AnimatedEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <style>{`
        @keyframes edge-dash-flow {
          from {
            stroke-dashoffset: 24;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .animated-edge-dash-${id} {
          animation: edge-dash-flow 1.5s linear infinite;
        }
      `}</style>

      {/* Hover glow path */}
      <path
        id={`${id}-glow`}
        className="react-flow__edge-path opacity-0 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
        d={edgePath}
        fill="none"
        stroke="rgba(139, 92, 246, 0.2)"
        strokeWidth={6}
        style={{ filter: "blur(3px)" }}
      />

      {/* Main structural edge line */}
      <path
        id={`${id}-main`}
        className="react-flow__edge-path stroke-zinc-800 transition-colors duration-300"
        d={edgePath}
        fill="none"
        strokeWidth={1.5}
        style={style}
      />

      {/* Animated signal particle overlay */}
      <path
        id={`${id}-particles`}
        className={`react-flow__edge-path stroke-violet-500/80 pointer-events-none animated-edge-dash-${id}`}
        d={edgePath}
        fill="none"
        strokeWidth={1.5}
        strokeDasharray="6,12"
        markerEnd={markerEnd}
      />
    </>
  );
};
export default AnimatedEdge;
