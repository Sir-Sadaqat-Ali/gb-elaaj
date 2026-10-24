"use client";

import * as React from "react";
import { Camera } from "lucide-react";
import { updateProfilePhotoAction } from "@/lib/actions/account";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UploadField, type UploadResult } from "@/components/uploads/upload-field";

export function ProfilePhotoForm({ name, image }: { name: string; image?: string | null }) {
  const [upload, setUpload] = React.useState<UploadResult | null>(null);

  return (
    <form action={updateProfilePhotoAction} className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <Avatar src={image} name={name} size={72} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <input type="hidden" name="fileKey" value={upload?.fileKey ?? ""} />
        <UploadField
          category="profile-photo"
          value={upload}
          onUploaded={setUpload}
          label="Profile picture"
          hint="PNG, JPG, or WebP. Maximum 2 MB."
        />
        <div className="mt-3 flex justify-end">
          <Button type="submit" size="sm" disabled={!upload?.fileKey}>
            <Camera className="h-3.5 w-3.5" />
            Save picture
          </Button>
        </div>
      </div>
    </form>
  );
}
