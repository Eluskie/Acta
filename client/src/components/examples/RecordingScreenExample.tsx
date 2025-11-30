import RecordingScreen from "../RecordingScreen";

export default function RecordingScreenExample() {
  return (
    <RecordingScreen
      buildingName="Comunidad Edificio Alameda 42"
      attendeesCount={12}
      onStop={(duration) => console.log("Recording stopped at:", duration, "seconds")}
    />
  );
}
