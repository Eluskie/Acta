import { motion } from "framer-motion";
import { Building2, Users, FileText, Clock, ChevronRight, AlertCircle } from "lucide-react";
import type { Building } from "@/lib/mockBuildings";
import { formatRelativeDate } from "@/lib/mockBuildings";

interface BuildingCardProps {
  building: Building;
  onClick: () => void;
}

/**
 * BuildingCard Component
 * 
 * Design Decisions:
 * - Color accent on left border for quick visual identification
 * - Hover lifts card with shadow for depth perception
 * - Stats shown as icons to reduce text cognitive load
 * - Pending badge pulses gently to draw attention without being annoying
 * - Touch target is the entire card for mobile ease
 */
export default function BuildingCard({ building, onClick }: BuildingCardProps) {
  const hasPending = building.stats.pendingActas > 0;
  
  return (
    <motion.button
      onClick={onClick}
      className="w-full text-left group relative"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {/* Card Container */}
      <div 
        className="relative bg-card rounded-2xl border border-border/50 overflow-hidden transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-black/5 group-hover:border-border"
      >
        {/* Color Accent Bar - Left side for visual identification */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5"
          style={{ backgroundColor: building.color }}
        />
        
        {/* Content */}
        <div className="p-5 pl-6">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              {/* Building Name */}
              <h3 className="font-semibold text-foreground text-base leading-tight truncate group-hover:text-primary transition-colors duration-200">
                {building.name}
              </h3>
              {/* Address - truncated for cleanliness */}
              <p className="text-sm text-muted-foreground mt-0.5 truncate">
                {building.address.split(',')[0]}
              </p>
            </div>
            
            {/* Pending Badge - Only shows if there are pending items */}
            {hasPending && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex-shrink-0"
              >
                <div className="relative">
                  {/* Pulse animation ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ backgroundColor: building.color }}
                    animate={{ 
                      scale: [1, 1.4, 1],
                      opacity: [0.4, 0, 0.4]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  {/* Badge */}
                  <div 
                    className="relative flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-medium"
                    style={{ backgroundColor: building.color }}
                  >
                    <AlertCircle className="w-3 h-3" />
                    {building.stats.pendingActas}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Stats Row - Icons for quick scanning */}
          <div className="flex items-center gap-4 text-sm">
            {/* Total Actas */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span>{building.stats.totalActas} actas</span>
            </div>
            
            {/* Contacts Count */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{building.contacts.length}</span>
            </div>
            
            {/* Last Meeting */}
            {building.stats.lastMeetingDate && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {formatRelativeDate(building.stats.lastMeetingDate)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Hover Arrow Indicator */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </motion.button>
  );
}

/**
 * AddBuildingCard Component
 * 
 * A visually distinct card that invites the user to add a new building.
 * Dashed border signals "empty/add" state (common UI pattern).
 */
export function AddBuildingCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      className="w-full h-full min-h-[120px]"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="h-full border-2 border-dashed border-border/60 rounded-2xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-200 p-5">
        <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center">
          <Building2 className="w-5 h-5" />
        </div>
        <span className="text-sm font-medium">Añadir edificio</span>
      </div>
    </motion.button>
  );
}


