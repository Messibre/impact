import "dotenv/config";
import { ethers } from "ethers";
import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";

/**
 * ONE-TIME script (spec section 5): registers the EAS schema and prints
 * the resulting UID so you can paste it into .env as EAS_SCHEMA_UID.
 * Run manually: `npm run eas:register-schema`
 * Re-run only if you deploy against a fresh registry / new network.
 */
async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const signer = new ethers.Wallet(process.env.SIGNER_PRIVATE_KEY as string, provider);

  const registry = new SchemaRegistry(process.env.EAS_SCHEMA_REGISTRY_ADDRESS as string);
  registry.connect(signer);

  const schema =
    "string region,uint256 milestoneDate,string sdgIndicator,uint256 coverageAmount,bytes32 mediaHash";
  // SCOPE-EXTEND MARKER: append the image field here when the follow-up
  // spec arrives, e.g. ",bytes32 imageHash", then re-run this script and
  // update EAS_SCHEMA_UID in .env.

  const tx = await registry.register({
    schema,
    resolverAddress: ethers.ZeroAddress,
    revocable: true,
  });

  const uid = await tx.wait();
  console.log("Schema registered. UID:", uid);
  console.log("Add this to your .env as EAS_SCHEMA_UID");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
