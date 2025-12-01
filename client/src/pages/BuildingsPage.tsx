import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Search, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BuildingCard, { AddBuildingCard } from "@/components/BuildingCard";
import { mockBuildings } from "@/lib/mockBuildings";

/**
 * BuildingsPage
 * 
 * Design Philosophy:
 * - Clean header with search for scalability
 * - Grid layout that adapts from 1 column (mobile) to 3 columns (desktop)
 * - Staggered animation on load for visual delight
 * - Empty state if no buildings exist
 * - Floating action button on mobile for easy access
 */
export default function BuildingsPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter buildings based on search
  const filteredBuildings = mockBuildings.filter(building =>
    building.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    building.address.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Animation variants for staggered grid
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 -ml-2"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            {/* Title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Mis Edificios
              </h1>
              <p className="text-sm text-muted-foreground">
                {mockBuildings.length} edificios · {mockBuildings.reduce((acc, b) => acc + b.stats.totalActas, 0)} actas
              </p>
            </div>
            
            {/* Add Button - Desktop */}
            <Button
              className="hidden sm:flex gap-2"
              onClick={() => {/* TODO: Add building modal */}}
            >
              <Plus className="w-4 h-4" />
              Nuevo
            </Button>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar edificio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/20"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
        <AnimatePresence mode="wait">
          {filteredBuildings.length === 0 && searchQuery ? (
            // No Results State
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Sin resultados
              </h3>
              <p className="text-muted-foreground">
                No hay edificios que coincidan con "{searchQuery}"
              </p>
            </motion.div>
          ) : filteredBuildings.length === 0 ? (
            // Empty State
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Añade tu primer edificio
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Organiza tus actas por edificio para encontrarlas fácilmente y guardar los contactos.
              </p>
              <Button onClick={() => {/* TODO */}}>
                <Plus className="w-4 h-4 mr-2" />
                Añadir edificio
              </Button>
            </motion.div>
          ) : (
            // Buildings Grid
            <motion.div
              key="grid"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredBuildings.map((building) => (
                <motion.div key={building.id} variants={itemVariants}>
                  <BuildingCard
                    building={building}
                    onClick={() => navigate(`/edificios/${building.id}`)}
                  />
                </motion.div>
              ))}
              
              {/* Add Building Card - Always at the end */}
              <motion.div variants={itemVariants}>
                <AddBuildingCard onClick={() => {/* TODO */}} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile FAB */}
      <motion.div
        className="fixed bottom-6 right-6 sm:hidden z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 20 }}
      >
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg shadow-primary/25"
          onClick={() => {/* TODO */}}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </motion.div>
    </div>
  );
}


