// Building types and mock data for testing

export interface BuildingContact {
  id: string;
  name: string;
  role: string; // "presidente", "secretario", "administrador", "vecino"
  email: string;
  phone?: string;
}

export interface BuildingNote {
  id: string;
  content: string;
  createdAt: Date;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  image?: string; // Optional building image/color
  color: string; // Accent color for the building
  contacts: BuildingContact[];
  notes: BuildingNote[];
  stats: {
    totalActas: number;
    pendingActas: number;
    lastMeetingDate?: Date;
  };
}

export interface ActaSummary {
  id: string;
  buildingId: string;
  title: string;
  date: Date;
  status: 'recording' | 'processing' | 'review' | 'sent';
  summary?: string; // Brief description
}

// Mock Buildings Data
export const mockBuildings: Building[] = [
  {
    id: 'building-1',
    name: 'Edificio Montepinar',
    address: 'C/ Mirador de Montepinar, 8, 28001 Madrid',
    color: '#3B82F6', // Blue
    contacts: [
      {
        id: 'contact-1',
        name: 'Antonio Recio',
        role: 'presidente',
        email: 'antonio.recio@email.com',
        phone: '+34 612 345 678'
      },
      {
        id: 'contact-2',
        name: 'Enrique Pastor',
        role: 'secretario',
        email: 'enrique.pastor@email.com',
        phone: '+34 623 456 789'
      },
      {
        id: 'contact-3',
        name: 'Maite Figueroa',
        role: 'administrador',
        email: 'maite.figueroa@email.com'
      }
    ],
    notes: [
      {
        id: 'note-1',
        content: 'Código portal: 2580. Reuniones siempre los martes a las 19:00 en el salón comunitario.',
        createdAt: new Date('2025-11-15')
      },
      {
        id: 'note-2',
        content: 'El presidente Antonio puede ser complicado. Preparar documentación extra sobre temas de derrama.',
        createdAt: new Date('2025-11-20')
      }
    ],
    stats: {
      totalActas: 5,
      pendingActas: 1,
      lastMeetingDate: new Date('2025-11-30')
    }
  },
  {
    id: 'building-2',
    name: 'Residencial Las Rosas',
    address: 'Av. de las Rosas, 42, 28028 Madrid',
    color: '#10B981', // Green
    contacts: [
      {
        id: 'contact-4',
        name: 'Carmen López',
        role: 'presidente',
        email: 'carmen.lopez@email.com',
        phone: '+34 634 567 890'
      },
      {
        id: 'contact-5',
        name: 'Roberto Sánchez',
        role: 'secretario',
        email: 'roberto.sanchez@email.com'
      }
    ],
    notes: [
      {
        id: 'note-3',
        content: 'Comunidad muy organizada. Tienen grupo de WhatsApp para avisos. Parking en -2.',
        createdAt: new Date('2025-10-10')
      }
    ],
    stats: {
      totalActas: 3,
      pendingActas: 0,
      lastMeetingDate: new Date('2025-11-28')
    }
  },
  {
    id: 'building-3',
    name: 'Torre Picasso',
    address: 'Plaza Pablo Ruiz Picasso, 1, 28020 Madrid',
    color: '#8B5CF6', // Purple
    contacts: [
      {
        id: 'contact-6',
        name: 'Luis Martínez',
        role: 'administrador',
        email: 'luis.martinez@administracion.com',
        phone: '+34 645 678 901'
      }
    ],
    notes: [],
    stats: {
      totalActas: 1,
      pendingActas: 1,
      lastMeetingDate: new Date('2025-11-25')
    }
  }
];

// Mock Actas for buildings
export const mockActas: ActaSummary[] = [
  // Montepinar
  {
    id: 'acta-1',
    buildingId: 'building-1',
    title: 'Derrama extraordinaria',
    date: new Date('2025-11-30'),
    status: 'review',
    summary: 'Aprobación de derrama de 1.500€ para reparación de ascensor'
  },
  {
    id: 'acta-2',
    buildingId: 'building-1',
    title: 'Junta ordinaria trimestral',
    date: new Date('2025-10-15'),
    status: 'sent',
    summary: 'Revisión de cuentas y presupuesto anual'
  },
  {
    id: 'acta-3',
    buildingId: 'building-1',
    title: 'Reunión extraordinaria - Ascensor',
    date: new Date('2025-09-20'),
    status: 'sent',
    summary: 'Decisión sobre cambio de empresa mantenimiento'
  },
  {
    id: 'acta-4',
    buildingId: 'building-1',
    title: 'Junta ordinaria',
    date: new Date('2025-07-10'),
    status: 'sent'
  },
  {
    id: 'acta-5',
    buildingId: 'building-1',
    title: 'Junta constitutiva',
    date: new Date('2025-05-05'),
    status: 'sent'
  },
  // Las Rosas
  {
    id: 'acta-6',
    buildingId: 'building-2',
    title: 'Junta ordinaria anual',
    date: new Date('2025-11-28'),
    status: 'sent',
    summary: 'Aprobación de presupuesto 2026'
  },
  {
    id: 'acta-7',
    buildingId: 'building-2',
    title: 'Reunión jardines',
    date: new Date('2025-09-12'),
    status: 'sent',
    summary: 'Contratación de nueva empresa de jardinería'
  },
  {
    id: 'acta-8',
    buildingId: 'building-2',
    title: 'Junta extraordinaria',
    date: new Date('2025-06-20'),
    status: 'sent'
  },
  // Torre Picasso
  {
    id: 'acta-9',
    buildingId: 'building-3',
    title: 'Primera reunión',
    date: new Date('2025-11-25'),
    status: 'review',
    summary: 'Presentación del mediador y planificación'
  }
];

// Helper functions
export function getBuildingActas(buildingId: string): ActaSummary[] {
  return mockActas.filter(acta => acta.buildingId === buildingId)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function getBuilding(buildingId: string): Building | undefined {
  return mockBuildings.find(b => b.id === buildingId);
}

export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  if (diffDays < 365) return `Hace ${Math.floor(diffDays / 30)} meses`;
  return `Hace ${Math.floor(diffDays / 365)} años`;
}


