import CreateCanvasFormClient from "./create-canvas-form-client";

type CreateCanvasFormProps = {
  onCanvasCreated?: () => void;
};

export default function CreateCanvasForm({ onCanvasCreated }: CreateCanvasFormProps) {
  return <CreateCanvasFormClient onCanvasCreated={onCanvasCreated} />;
}
