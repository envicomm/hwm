import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/certificates/$id")({
  component: CertificateDetail,
});

function CertificateDetail() {
  const { id } = Route.useParams();
  return <div>Certificate: {id}</div>;
}
