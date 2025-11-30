import EmptyState from "../EmptyState";

export default function EmptyStateExample() {
  return (
    <EmptyState onStartRecording={() => console.log("Start recording clicked")} />
  );
}
