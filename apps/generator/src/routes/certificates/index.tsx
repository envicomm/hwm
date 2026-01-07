import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/certificates/")({
  component: Certificates,
});

function Certificates() {
  return <div>Certificates Page</div>;
}
