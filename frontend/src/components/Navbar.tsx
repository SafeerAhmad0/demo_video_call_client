import { Link } from "react-router-dom"

export default function Navbar() {
  return (
    <nav style={{ padding: 12, borderBottom: "1px solid #ddd" }}>
      <Link to="/" style={{ marginRight: 10 }}>Home</Link>
      <Link to="/info-form" style={{ marginRight: 10 }}>Info Form</Link>
      <Link to="/submissions">Submissions</Link>
    </nav>
  )
}