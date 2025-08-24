// src/pages/PreviewPage.tsx
import { useEffect, useState } from "react";
import { getFormData, generatePdf, sendEmail } from "../services/api";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";

export default function PreviewPage() {
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const data = await getFormData();
      setFormData(data);
    })();
  }, []);

  const handleDownloadPdf = async () => {
    const pdfBlob = await generatePdf(formData);
    const url = window.URL.createObjectURL(new Blob([pdfBlob as BlobPart]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "form-data.pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSendEmail = async () => {
    await sendEmail(formData);
    alert("Email sent successfully!");
  };

  if (!formData) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Preview Form Data</h1>

      {/* <Card className="mb-4">
        <CardContent className="space-y-2">
          <p><strong>Name:</strong> {formData.name}</p>
          <p><strong>Email:</strong> {formData.email}</p>
          <p><strong>Message:</strong> {formData.message}</p>
        </CardContent>
      </Card> */}

      <div className="flex gap-4">
        {/* <Button onClick={handleDownloadPdf}>Download PDF</Button>
        <Button onClick={handleSendEmail} variant="secondary" >
          Send Email
        </Button> */}
      </div>
    </div>
  );
}
