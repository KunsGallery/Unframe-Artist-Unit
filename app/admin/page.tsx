import AdminClient from "./admin-client";

export default function AdminPage() {
  return <><AdminClient /><a className="admin-route-link" href="/admin/access">Role access review ↗</a></>;
}
