import CreateModel from "./CreateModel";
import { useParams } from "react-router-dom";

export default function EditModel() {
  const { id } = useParams();
  return <CreateModel existingModel={true} modelId={id} />;
}