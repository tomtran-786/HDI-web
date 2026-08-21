import { google } from "googleapis";

let cachedDrive: ReturnType<typeof google.drive> | undefined;

function normalizePrivateKey(raw: string | undefined) {
  if (!raw) return undefined;
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n");
}

function driveClient() {
  if (cachedDrive) return cachedDrive;
  const email = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  const key = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);
  if (!email || !key) {
    throw new Error("Thiếu GOOGLE_CLIENT_EMAIL hoặc GOOGLE_PRIVATE_KEY.");
  }
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  cachedDrive = google.drive({ version: "v3", auth });
  return cachedDrive;
}

function errorStatus(error: unknown) {
  const value = error as { code?: number; response?: { status?: number } };
  return value.code ?? value.response?.status;
}

async function findDirectPermission(fileId: string, email: string) {
  const drive = driveClient();
  const target = email.trim().toLowerCase();
  let pageToken: string | undefined;
  do {
    const response = await drive.permissions.list({
      fileId,
      supportsAllDrives: true,
      pageSize: 100,
      pageToken,
      fields:
        "nextPageToken,permissions(id,emailAddress,role,type,permissionDetails(inherited))",
    });
    const found = response.data.permissions?.find((permission) => {
      if (permission.emailAddress?.trim().toLowerCase() !== target) return false;
      const details = permission.permissionDetails ?? [];
      return details.length === 0 || details.some((detail) => detail.inherited === false);
    });
    if (found?.id) return found.id;
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);
  return null;
}

export async function grantDrivePermission(fileId: string, email: string) {
  const existing = await findDirectPermission(fileId, email);
  if (existing) return { success: true as const, permissionId: existing };

  const response = await driveClient().permissions.create({
    fileId,
    supportsAllDrives: true,
    sendNotificationEmail: true,
    emailMessage:
      "HDI Research Center đã cấp quyền truy cập học liệu cho khóa học bạn vừa thanh toán.",
    fields: "id",
    requestBody: { role: "reader", type: "user", emailAddress: email },
  });
  if (!response.data.id) throw new Error("Google Drive không trả permission id.");
  return { success: true as const, permissionId: response.data.id };
}

export async function revokeDrivePermission(
  fileId: string,
  email: string,
  permissionId: string | null,
) {
  const resolved = permissionId ?? (await findDirectPermission(fileId, email));
  if (!resolved) return { success: true as const, alreadyGone: true as const };
  try {
    await driveClient().permissions.delete({
      fileId,
      permissionId: resolved,
      supportsAllDrives: true,
    });
    return { success: true as const, permissionId: resolved };
  } catch (error) {
    if (errorStatus(error) === 404) {
      // A permission may have been manually replaced after its id was stored.
      // Resolve by email once more before declaring access gone.
      if (permissionId) {
        const current = await findDirectPermission(fileId, email);
        if (current && current !== resolved) {
          await driveClient().permissions.delete({
            fileId,
            permissionId: current,
            supportsAllDrives: true,
          });
          return { success: true as const, permissionId: current };
        }
      }
      return { success: true as const, alreadyGone: true as const };
    }
    throw error;
  }
}
