import AdminClient from "./admin-client";
import AdminTestingPanel from "./testing-panel";
import AdminEditorTab from "./editor-tab";

export default function AdminPage() {
  return <><AdminClient /><AdminEditorTab /><AdminTestingPanel /></>;
}
