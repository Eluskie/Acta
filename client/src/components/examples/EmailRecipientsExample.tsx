import { useState } from "react";
import EmailRecipients, { type Recipient } from "../EmailRecipients";

const mockRecipients: Recipient[] = [
  { id: "1", email: "presidente@edificio42.es", name: "Juan García" },
  { id: "2", email: "secretaria@edificio42.es", name: "María López" },
];

export default function EmailRecipientsExample() {
  const [recipients, setRecipients] = useState(mockRecipients);

  return (
    <div className="max-w-lg">
      <EmailRecipients recipients={recipients} onChange={setRecipients} />
    </div>
  );
}
