import ActaPreview from "../ActaPreview";

const mockActaData = {
  buildingName: "Comunidad de Propietarios Edificio Alameda 42",
  address: "Calle Alameda 42, 28001 Madrid",
  date: "28 de noviembre de 2025",
  time: "18:30",
  attendees: [
    "Juan García (Presidente)",
    "María López (Secretaria)", 
    "Antonio Martínez",
    "Carmen Ruiz",
    "Pedro Sánchez",
    "Ana Fernández",
  ],
  agenda: [
    "Lectura y aprobación del acta anterior",
    "Estado de cuentas y aprobación de presupuesto 2026",
    "Reparación de la fachada",
    "Ruegos y preguntas",
  ],
  resolutions: [
    {
      title: "Aprobación del acta de la reunión anterior",
      approved: true,
      votes: "Unanimidad (12 votos a favor)",
    },
    {
      title: "Aprobación del presupuesto 2026",
      approved: true,
      votes: "Mayoría (10 votos a favor, 2 abstenciones)",
    },
    {
      title: "Derrama para reparación de fachada",
      approved: true,
      votes: "Mayoría cualificada (11 votos a favor, 1 en contra)",
    },
  ],
  observations: "Se acuerda realizar una reunión extraordinaria en enero para revisar el avance de las obras de fachada.",
};

export default function ActaPreviewExample() {
  return (
    <div className="max-w-xl">
      <ActaPreview data={mockActaData} />
    </div>
  );
}
