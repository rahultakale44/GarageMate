package com.garagemate.api.integration.cloudinary;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * Cloudinary image upload service.
 * Mirrors Node.js cloudinary.ts behavior.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Uploads a file to Cloudinary and returns the secure URL.
     *
     * @param file   the multipart file to upload
     * @param folder the Cloudinary folder (e.g. "garagemate/avatars", "garagemate/garages")
     * @return secure URL of the uploaded image
     */
    public String upload(MultipartFile file, String folder) throws IOException {
        Map<?, ?> result = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "folder", folder,
                        "resource_type", "image",
                        "quality", "auto",
                        "fetch_format", "auto"
                )
        );
        String url = (String) result.get("secure_url");
        log.info("Uploaded to Cloudinary: {} → {}", file.getOriginalFilename(), url);
        return url;
    }

    /**
     * Deletes an image from Cloudinary by its public ID.
     * Public ID is the path without the base URL (e.g. "garagemate/avatars/abc123").
     */
    public void delete(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            log.info("Deleted from Cloudinary: {}", publicId);
        } catch (IOException e) {
            log.warn("Failed to delete Cloudinary asset {}: {}", publicId, e.getMessage());
        }
    }

    /**
     * Extracts the Cloudinary public ID from a secure URL.
     * Example: https://res.cloudinary.com/{cloud}/image/upload/v123/garagemate/avatars/abc.jpg
     * → garagemate/avatars/abc
     */
    public String extractPublicId(String secureUrl) {
        if (secureUrl == null) return null;
        // Find /upload/ and strip everything before + after (strip extension)
        int uploadIdx = secureUrl.indexOf("/upload/");
        if (uploadIdx < 0) return null;
        String path = secureUrl.substring(uploadIdx + "/upload/".length());
        // Remove version segment if present (v1234567/)
        if (path.startsWith("v") && path.contains("/")) {
            path = path.substring(path.indexOf('/') + 1);
        }
        // Remove file extension
        int dotIdx = path.lastIndexOf('.');
        return dotIdx > 0 ? path.substring(0, dotIdx) : path;
    }
}
