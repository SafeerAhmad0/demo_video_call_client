import React, { useState } from "react";
import { submitForm } from "../services/api";

export default function InfoForm() {
  const [form, setForm] = useState({ name: "", email: "", info: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    navigator.geolocation.getCurrentPosition(async (pos) => {
      await submitForm({
        ...form,
        meeting_id: "claim-room-123",
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      alert("Form submitted!");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <textarea
        placeholder="Info"
        value={form.info}
        onChange={(e) => setForm({ ...form, info: e.target.value })}
      />
      <button type="submit">Submit</button>
    </form>
  );
}
