import { Server } from "..";

export default class UserUUIDLicenseCache {
  private userLicenses = new Map<string, string>();
  private licenseOwners = new Map<string, string>();
  private licenseCapabilities = new Map<string, string[]>();

  async getUsersLicense(uuid: string) {
    if (this.userLicenses.has(uuid) == false) {
      const user = await Server.prisma.user.findUnique({
        where: {
          id: uuid,
        },
      });

      if (user?.licenseId) {
        this.setUsersLicense(uuid, user?.licenseId || "");
      }
    }

    return this.userLicenses.get(uuid);
  }

  async getLicenseOwner(license: string) {
    if (this.licenseOwners.has(license) == false) {
      const user = await Server.prisma.license.findUnique({
        where: {
          id: license,
        },
      });

      if (user) {
        this.setLicenseOwner(user?.id, license);
      }
    }

    return this.licenseOwners.get(license);
  }

  async getCapabilities(license: string) {
    if (this.licenseCapabilities.get(license) == undefined) {
      const licenseData = await Server.prisma.license.findUnique({
        where: {
          id: license,
        },
      });

      if (licenseData) {
        this.licenseCapabilities.set(
          license,
          JSON.parse(licenseData?.capabilities)
        );

        this.setLicenseOwner(licenseData?.userId, license);
      }
    }

    return this.licenseCapabilities.get(license);
  }

  async refresh(license: string) {
    const licenseData = await Server.prisma.license.findUnique({
      where: {
        id: license,
      },
    });

    if (licenseData) {
      this.licenseCapabilities.set(
        license,
        JSON.parse(licenseData?.capabilities)
      );

      this.setLicenseOwner(licenseData?.userId, license);
    }
    return this.licenseCapabilities.get(license);
  }

  setLicenseOwner(uuid: string, license: string) {
    this.userLicenses.set(uuid, license);
    this.licenseOwners.set(license, uuid);
  }

  setUsersLicense(uuid: string, license: string) {
    this.licenseOwners.set(license, uuid);
    this.userLicenses.set(uuid, license);
  }

  removeLicense(uuid: string) {
    this.licenseOwners.delete(this.userLicenses.get(uuid) || "");
    this.userLicenses.delete(uuid);
  }

  removeOwner(license: string) {
    this.userLicenses.delete(this.licenseOwners.get(license) || "");
    this.licenseOwners.delete(license);
  }
}
