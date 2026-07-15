export async function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ url: string; publicId: string }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !preset) throw new Error("Cloudinary chưa được cấu hình");

  const resourceType = file.type.startsWith("video/") ? "video" : "image";

  // Cloudinary free plan: hard cap 100 MB/file. Chặn sớm để báo lỗi rõ ràng.
  const MAX_BYTES = 100 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    const mb = Math.round(file.size / 1024 / 1024);
    throw new Error(`File ${mb}MB vượt giới hạn 100MB. Hãy quay video ngắn hơn hoặc nén lại.`);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve({ url: data.secure_url, publicId: data.public_id });
      } else {
        // Cloudinary trả JSON { error: { message } } khi từ chối
        let msg = `HTTP ${xhr.status}`;
        try { msg = JSON.parse(xhr.responseText)?.error?.message ?? msg; } catch {}
        reject(new Error(`Upload thất bại: ${msg}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload thất bại: mất kết nối tới Cloudinary (file quá lớn hoặc mạng yếu)"));

    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);
    xhr.send(formData);
  });
}
