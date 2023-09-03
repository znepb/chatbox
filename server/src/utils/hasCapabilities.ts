import { Server } from "..";

export default async function hasCapabilities(
  license: string | null,
  capabilities: string[]
): Promise<{
  success: boolean;
  data: any;
}> {
  if (license == null) {
    return { success: false, data: "No license found" };
  }

  const ownerID = await Server.uuidLicenseCache.getLicenseOwner(license);
  const userCapabilities = await Server.uuidLicenseCache.getCapabilities(
    license
  );
  if (userCapabilities == null) {
    return {
      success: false,
      data: "No capabilities, something has gone terribly wrong",
    };
  }
  if (ownerID == null) {
    return {
      success: false,
      data: "No owner ID, something has gone terribly wrong",
    };
  }

  const missingCapabilities = [];

  for (const capability of capabilities) {
    if (!userCapabilities.includes(capability)) {
      missingCapabilities.push(capability);
    }
  }

  if (missingCapabilities.length > 0) {
    return {
      success: false,
      data: `Missing capabilities: ${missingCapabilities.join(", ")}`,
    };
  }

  return {
    success: true,
    data: {
      capabilities: userCapabilities,
      ownerID,
    },
  };
}
