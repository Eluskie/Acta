import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Plus, 
  Users, 
  FileText, 
  StickyNote,
  Phone,
  Mail,
  MoreHorizontal,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Pencil,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  getBuilding, 
  getBuildingActas, 
  formatRelativeDate,
  type Building,
  type BuildingContact,
  type BuildingNote,
  type ActaSummary
} from "@/lib/mockBuildings";

/**
 * BuildingDetailPage
 * 
 * Design Philosophy:
 * - Hero header with building color for brand consistency
 * - Tab navigation for organizing content without overwhelming
 * - Contact cards are tappable with copy-to-clipboard micro-interaction
 * - Acta list shows status clearly with color coding
 * - Notes are collapsible for space efficiency
 * - Quick action FAB for starting new acta for this building
 */
export default function BuildingDetailPage() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/edificios/:id");
  const buildingId = params?.id;
  
  const [activeTab, setActiveTab] = useState<'actas' | 'contactos' | 'notas'>('actas');
  
  // Get building data
  const building = buildingId ? getBuilding(buildingId) : undefined;
  const actas = buildingId ? getBuildingActas(buildingId) : [];
  
  if (!building) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Edificio no encontrado</p>
          <Button onClick={() => navigate("/edificios")}>
            Volver a edificios
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'actas', label: 'Actas', count: building.stats.totalActas, icon: FileText },
    { id: 'contactos', label: 'Contactos', count: building.contacts.length, icon: Users },
    { id: 'notas', label: 'Notas', count: building.notes.length, icon: StickyNote },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Header with Building Color */}
      <header 
        className="relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${building.color}15 0%, ${building.color}05 100%)` 
        }}
      >
        {/* Decorative circles */}
        <div 
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
          style={{ backgroundColor: building.color }}
        />
        <div 
          className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-10"
          style={{ backgroundColor: building.color }}
        />
        
        <div className="relative max-w-4xl mx-auto px-4 pt-4 pb-6">
          {/* Navigation Row */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 -ml-2 hover:bg-white/50"
              onClick={() => navigate("/edificios")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-white/50"
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Building Info */}
          <div className="flex items-start gap-4">
            {/* Color Indicator */}
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
              style={{ backgroundColor: building.color }}
            >
              <span className="text-white text-xl font-bold">
                {building.name.charAt(0)}
              </span>
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
                {building.name}
              </h1>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="truncate">{building.address}</span>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-6 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{building.stats.totalActas}</div>
              <div className="text-xs text-muted-foreground">Actas</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{building.contacts.length}</div>
              <div className="text-xs text-muted-foreground">Contactos</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: building.stats.pendingActas > 0 ? building.color : undefined }}>
                {building.stats.pendingActas}
              </div>
              <div className="text-xs text-muted-foreground">Pendientes</div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                  ${activeTab === tab.id 
                    ? 'text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`
                    text-xs px-1.5 py-0.5 rounded-full
                    ${activeTab === tab.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
                
                {/* Active Indicator */}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: building.color }}
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'actas' && (
            <motion.div
              key="actas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ActasList actas={actas} buildingColor={building.color} navigate={navigate} />
            </motion.div>
          )}
          
          {activeTab === 'contactos' && (
            <motion.div
              key="contactos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ContactsList contacts={building.contacts} buildingColor={building.color} />
            </motion.div>
          )}
          
          {activeTab === 'notas' && (
            <motion.div
              key="notas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <NotesList notes={building.notes} buildingColor={building.color} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Quick Action FAB - Start New Acta for This Building */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 20 }}
      >
        <Button
          size="lg"
          className="h-14 px-6 rounded-full shadow-lg gap-2"
          style={{ backgroundColor: building.color }}
          onClick={() => navigate("/acta/new")}
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nueva Acta</span>
        </Button>
      </motion.div>
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

interface ActasListProps {
  actas: ActaSummary[];
  buildingColor: string;
  navigate: (path: string) => void;
}

function ActasList({ actas, buildingColor, navigate }: ActasListProps) {
  if (actas.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Sin actas todavía"
        description="Crea tu primera acta para este edificio"
        actionLabel="Nueva Acta"
        onAction={() => navigate("/acta/new")}
        color={buildingColor}
      />
    );
  }

  // Group actas by status for visual organization
  const pendingActas = actas.filter(a => a.status === 'review' || a.status === 'recording' || a.status === 'processing');
  const sentActas = actas.filter(a => a.status === 'sent');

  return (
    <div className="space-y-6">
      {/* Pending Section */}
      {pendingActas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" style={{ color: buildingColor }} />
            Pendientes ({pendingActas.length})
          </h3>
          <div className="space-y-2">
            {pendingActas.map((acta) => (
              <ActaCard 
                key={acta.id} 
                acta={acta} 
                buildingColor={buildingColor}
                onClick={() => navigate(`/acta/${acta.id}`)}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Sent Section */}
      {sentActas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Enviadas ({sentActas.length})
          </h3>
          <div className="space-y-2">
            {sentActas.map((acta) => (
              <ActaCard 
                key={acta.id} 
                acta={acta} 
                buildingColor={buildingColor}
                onClick={() => navigate(`/acta/${acta.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ActaCardProps {
  acta: ActaSummary;
  buildingColor: string;
  onClick: () => void;
}

function ActaCard({ acta, buildingColor, onClick }: ActaCardProps) {
  const statusConfig = {
    recording: { label: 'Grabando', color: '#EF4444', icon: Loader2 },
    processing: { label: 'Procesando', color: '#F59E0B', icon: Loader2 },
    review: { label: 'En revisión', color: buildingColor, icon: Pencil },
    sent: { label: 'Enviada', color: '#10B981', icon: CheckCircle2 },
  };
  
  const status = statusConfig[acta.status];
  const StatusIcon = status.icon;

  return (
    <motion.button
      onClick={onClick}
      className="w-full text-left group"
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="bg-card rounded-xl border border-border/50 p-4 flex items-center gap-4 hover:border-border hover:shadow-sm transition-all">
        {/* Status Indicator */}
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${status.color}15` }}
        >
          <StatusIcon 
            className={`w-5 h-5 ${acta.status === 'processing' || acta.status === 'recording' ? 'animate-spin' : ''}`}
            style={{ color: status.color }}
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {acta.title}
          </h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {acta.date.toLocaleDateString('es-ES', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
              })}
            </span>
          </div>
          {acta.summary && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {acta.summary}
            </p>
          )}
        </div>
        
        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.button>
  );
}

interface ContactsListProps {
  contacts: BuildingContact[];
  buildingColor: string;
}

function ContactsList({ contacts, buildingColor }: ContactsListProps) {
  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Sin contactos"
        description="Añade contactos para enviar actas fácilmente"
        actionLabel="Añadir contacto"
        onAction={() => {/* TODO */}}
        color={buildingColor}
      />
    );
  }

  return (
    <div className="space-y-3">
      {contacts.map((contact) => (
        <ContactCard key={contact.id} contact={contact} buildingColor={buildingColor} />
      ))}
      
      {/* Add Contact Button */}
      <button className="w-full border-2 border-dashed border-border/60 rounded-xl p-4 flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all">
        <Plus className="w-5 h-5" />
        <span className="font-medium">Añadir contacto</span>
      </button>
    </div>
  );
}

interface ContactCardProps {
  contact: BuildingContact;
  buildingColor: string;
}

function ContactCard({ contact, buildingColor }: ContactCardProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  
  const roleLabels: Record<string, string> = {
    presidente: 'Presidente',
    secretario: 'Secretario',
    administrador: 'Administrador',
    vecino: 'Vecino'
  };

  const copyEmail = async () => {
    await navigator.clipboard.writeText(contact.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white font-semibold"
          style={{ backgroundColor: buildingColor }}
        >
          {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground truncate">{contact.name}</h4>
            <Badge variant="secondary" className="shrink-0 text-xs">
              {roleLabels[contact.role] || contact.role}
            </Badge>
          </div>
          
          {/* Contact Actions */}
          <div className="flex flex-wrap gap-2 mt-2">
            <button
              onClick={copyEmail}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">Copiado</span>
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span className="truncate max-w-[200px]">{contact.email}</span>
                  <Copy className="w-3 h-3 opacity-50" />
                </>
              )}
            </button>
            
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>{contact.phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface NotesListProps {
  notes: BuildingNote[];
  buildingColor: string;
}

function NotesList({ notes, buildingColor }: NotesListProps) {
  if (notes.length === 0) {
    return (
      <EmptyState
        icon={StickyNote}
        title="Sin notas"
        description="Añade notas importantes sobre este edificio"
        actionLabel="Añadir nota"
        onAction={() => {/* TODO */}}
        color={buildingColor}
      />
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <div 
          key={note.id}
          className="bg-card rounded-xl border border-border/50 p-4"
        >
          <p className="text-foreground whitespace-pre-wrap">{note.content}</p>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatRelativeDate(note.createdAt)}
          </p>
        </div>
      ))}
      
      {/* Add Note Button */}
      <button className="w-full border-2 border-dashed border-border/60 rounded-xl p-4 flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all">
        <Plus className="w-5 h-5" />
        <span className="font-medium">Añadir nota</span>
      </button>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  color: string;
}

function EmptyState({ icon: Icon, title, description, actionLabel, onAction, color }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-8 h-8" style={{ color }} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      <Button onClick={onAction} style={{ backgroundColor: color }}>
        <Plus className="w-4 h-4 mr-2" />
        {actionLabel}
      </Button>
    </div>
  );
}


