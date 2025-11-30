import MeetingCard, { type Meeting } from "../MeetingCard";

const mockMeeting: Meeting = {
  id: "1",
  buildingName: "Comunidad Edificio Alameda 42",
  date: "28 Nov 2025",
  attendeesCount: 12,
  status: "enviado",
};

export default function MeetingCardExample() {
  return (
    <div className="max-w-md">
      <MeetingCard 
        meeting={mockMeeting} 
        onClick={() => console.log("Meeting clicked:", mockMeeting.id)} 
      />
    </div>
  );
}
