import AdminClient from "./admin-client";
import AdminTestingPanel from "./testing-panel";

export default function AdminPage() {
  return <><AdminClient /><AdminTestingPanel /><a className="admin-route-link" href="/admin/access">Role access review ↗</a></>;
}
