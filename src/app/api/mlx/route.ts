import { mlxStatus } from "@/lib/mlx";

export async function GET() {
  return Response.json(await mlxStatus());
}
