import Header from "../Header";

export default function HeaderExample() {
  return (
    <Header onSearch={(query) => console.log("Search query:", query)} />
  );
}
