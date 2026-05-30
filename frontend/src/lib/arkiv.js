import { createPublicClient, http } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { eq } from "@arkiv-network/sdk/query";

export const PROJECT_ATTRIBUTE = {
  key: "_project",
  value: "rutasegura_rn51",
};

export const publicClient = createPublicClient({
  chain: braga,
  transport: http(),
});

export async function queryReports(filters = {}) {
  const { tipo_incidente, urgencia, limit = 50 } = filters;

  let query = publicClient
    .buildQuery()
    .where(eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value))
    .withPayload(true);

  if (tipo_incidente) {
    query = query.where(eq("datos_evento.tipo_incidente", tipo_incidente));
  }

  if (urgencia) {
    query = query.where(eq("validacion_ia.clasificacion_urgencia_ia", urgencia));
  }

  const { entities } = await query.fetch();

  return entities.map((entity) => {
    const payload = entity.toJson();
    return { key: entity.key, payload, entity };
  });
}
