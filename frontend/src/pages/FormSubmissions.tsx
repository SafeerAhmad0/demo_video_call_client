import { useEffect, useState } from "react"
import api from "../services/api"

type FormSubmission = {
  id: number
  full_name: string
  email: string
  notes?: string
}

export default function FormSubmissions() {
  const [data, setData] = useState<FormSubmission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<FormSubmission[]>("/forms").then((res) => {
      setData(res.data)
      setLoading(false)
    })
  }, [])

  async function handleDownloadPDF() {
    const res = await api.get<Blob>("/forms/pdf", { responseType: "blob" as 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "submissions.pdf")
    document.body.appendChild(link)
    link.click()
  }

  async function handleSendEmail() {
    await api.post("/forms/send-email")
    alert("📧 Email Sent to Client")
  }

  if (loading) return <p>Loading...</p>

  return (
    <section>
      <h2>All Submissions</h2>
      <table border={1} cellPadding={8} style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {data.map((f) => (
            <tr key={f.id}>
              <td>{f.id}</td>
              <td>{f.full_name}</td>
              <td>{f.email}</td>
              <td>{f.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 20 }}>
        <button onClick={handleDownloadPDF}>⬇️ Download PDF</button>
        <button onClick={handleSendEmail} style={{ marginLeft: 10 }}>
          📧 Send PDF via Email
        </button>
      </div>
    </section>
  )
}
