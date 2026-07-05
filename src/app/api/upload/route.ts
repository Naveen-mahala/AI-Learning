import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const dynamic = "force-dynamic";

// Configure Cloudinary with environment credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const extension = fileName.split(".").pop()?.toLowerCase() || "";
    
    // Determine Cloudinary resource type
    // Images should use 'image', documents/presentations/spreadsheets use 'raw'
    const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(extension);
    const resourceType = isImage ? "image" : "raw";

    // Clean up the name for the Cloudinary public_id
    const safeBaseName = fileName
      .replace(/\.[^/.]+$/, "") // remove extension
      .replace(/[^a-zA-Z0-9-_]/g, "_"); // replace non-alphanumeric chars with underscore

    const publicId = `${Date.now()}-${safeBaseName}`;

    // Upload to Cloudinary using a stream
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "ai-learning-documents",
          resource_type: resourceType,
          public_id: publicId,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      title: fileName,
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    console.error("[upload] Cloudinary upload failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file to Cloudinary" },
      { status: 500 }
    );
  }
}
