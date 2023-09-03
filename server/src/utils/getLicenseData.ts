import { License } from "@prisma/client";

interface LicenseData {
  id: string;
  capabilities: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export default function getLicenseData(license: License): LicenseData {
  return {
    id: license.id,
    capabilities: JSON.parse(license.capabilities),
    createdAt: license.createdAt.toISOString(),
    updatedAt: license.updatedAt.toISOString(),
    userId: license.userId,
  };
}
