import "dotenv/config";

// Central place for EAS/Sepolia config. Only chain.service.ts should import this.
export const easConfig = {
  rpcUrl: process.env.SEPOLIA_RPC_URL as string,
  signerPrivateKey: process.env.SIGNER_PRIVATE_KEY as string,
  easContractAddress: process.env.EAS_CONTRACT_ADDRESS as string,
  schemaRegistryAddress: process.env.EAS_SCHEMA_REGISTRY_ADDRESS as string,
  schemaUID: process.env.EAS_SCHEMA_UID as string,
  network: "sepolia" as const,
};

// The exact schema string registered once via scripts/registerSchema.ts.
// Leave a visible marker for where the pending image field will be inserted.
export const EAS_SCHEMA_DEFINITION =
  "string region,uint256 milestoneDate,string sdgIndicator,uint256 coverageAmount,bytes32 mediaHash" +
  // SCOPE-EXTEND MARKER: the follow-up spec will add one image field here,
  // e.g. ",bytes32 imageHash". Insert it at the end of this string only.
  "";
