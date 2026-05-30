import { createWalletClient, http } from "@arkiv-network/sdk";
import { braga } from "@arkiv-network/sdk/chains";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { jsonToPayload } from "@arkiv-network/sdk/utils";

const [,, privateKey, payloadBase64, expiresInSec, attributesBase64] = process.argv;

const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf-8");
const expiresIn = expiresInSec ? Number(expiresInSec) : 604800;

let attributes = [];
if (attributesBase64 && attributesBase64 !== "_") {
  attributes = JSON.parse(Buffer.from(attributesBase64, "base64").toString("utf-8"));
}

const account = privateKeyToAccount(privateKey);

const client = createWalletClient({
  account,
  chain: braga,
  transport: http("https://braga.hoodi.arkiv.network/rpc"),
});

try {
  const { entityKey, txHash } = await client.createEntity({
    payload: jsonToPayload(JSON.parse(payloadJson)),
    contentType: "application/json",
    attributes,
    expiresIn,
  });
  console.log(JSON.stringify({ success: true, entityKey, txHash }));
} catch (e) {
  process.stderr.write(e.message + "\n");
  console.log(JSON.stringify({ success: false, error: e.message || String(e) }));
  process.exit(0);
}