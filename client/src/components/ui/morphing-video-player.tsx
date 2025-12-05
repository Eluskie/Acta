"use client"

import React, { useRef, useState, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Play, Maximize2, Minimize2, X } from "lucide-react"

interface MorphingVideoPlayerProps {
    videoSrc: string
    thumbnailSrc?: string
    className?: string
}

export function MorphingVideoPlayer({
    videoSrc,
    thumbnailSrc,
    className,
}: MorphingVideoPlayerProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [showControls, setShowControls] = useState(false)
    const [isMuted, setIsMuted] = useState(true)
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current && isExpanded) {
            videoRef.current.play().catch(() => {
                // Autoplay might be blocked
            })
        }
    }, [isExpanded])

    const handleClick = () => {
        if (!isExpanded && videoRef.current) {
            // Reset video to beginning and unmute when expanding
            videoRef.current.currentTime = 0
            setIsMuted(false)
            // Ensure video plays
            setTimeout(() => {
                videoRef.current?.play().catch(() => {
                    // Autoplay might be blocked
                })
            }, 100)
        } else {
            // Mute again when collapsing
            setIsMuted(true)
        }
        setIsExpanded(!isExpanded)
    }

    return (
        <div className={cn("relative w-full flex items-center justify-center", className)}>
            <motion.div
                layout
                className="relative overflow-hidden bg-black"
                initial={false}
                animate={{
                    borderRadius: "20px",
                    width: isExpanded ? "90%" : "320px",
                    height: isExpanded ? "auto" : "200px",
                }}
                transition={{
                    duration: 0.6,
                    ease: [0.32, 0.72, 0, 1],
                    layout: { duration: 0.6 }
                }}
                onClick={!isExpanded ? handleClick : undefined}
                onHoverStart={() => setShowControls(true)}
                onHoverEnd={() => setShowControls(false)}
                style={{
                    boxShadow: isExpanded
                        ? "0 30px 60px rgba(0,0,0,0.35)"
                        : "0 20px 40px rgba(0,0,0,0.2)",
                    cursor: isExpanded ? "default" : "pointer",
                    maxHeight: isExpanded ? "450px" : "200px",
                    aspectRatio: isExpanded ? "16/9" : "auto",
                }}
            >
                <video
                    ref={videoRef}
                    src={videoSrc}
                    className="w-full h-full"
                    style={{
                        objectFit: isExpanded ? "contain" : "cover",
                        backgroundColor: "#000"
                    }}
                    loop
                    muted={isMuted}
                    playsInline
                    controls={isExpanded}
                    controlsList="nodownload"
                />

                {/* Play Icon Overlay (only visible when collapsed) */}
                {!isExpanded && (
                    <motion.div
                        className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none bg-black/20"
                        initial={{ opacity: 1 }}
                        animate={{ opacity: showControls ? 0.9 : 1 }}
                    >
                        <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center mb-3 shadow-lg">
                            <Play className="w-6 h-6 text-black fill-black ml-1" />
                        </div>
                        <span className="text-white text-sm font-medium drop-shadow-lg">
                            Ver demo
                        </span>
                    </motion.div>
                )}

                {/* Expand hint (visible on hover when collapsed) */}
                {!isExpanded && showControls && (
                    <motion.div
                        className="absolute top-4 right-4 z-20 pointer-events-none"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg">
                            <Maximize2 className="w-4 h-4 text-black" />
                        </div>
                    </motion.div>
                )}

                {/* Close button (visible when expanded) */}
                {isExpanded && (
                    <motion.button
                        className="absolute top-4 right-4 z-30 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-xl hover:bg-white hover:scale-110 transition-all duration-200"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={(e) => {
                            e.stopPropagation()
                            handleClick()
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <X className="w-5 h-5 text-black" />
                    </motion.button>
                )}
            </motion.div>
        </div>
    )
}
