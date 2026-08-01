package com.smartclinic.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@PreAuthorize("hasRole('ADMIN')")
public class FileUploadController {

    private static final Map<String, String> ALLOWED_IMAGE_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif"
    );

    private final Path fileStorageLocation;

    public FileUploadController() {
        this.fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    @PostMapping
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        try {
            if (file.isEmpty()) {
                throw new IllegalArgumentException("Please select a non-empty image file.");
            }
            if (originalFileName.contains("..")) {
                throw new IllegalArgumentException("Filename contains an invalid path sequence.");
            }
            String fileExtension = ALLOWED_IMAGE_TYPES.get(file.getContentType());
            if (fileExtension == null) {
                throw new IllegalArgumentException("Only JPEG, PNG, WebP, and GIF images are supported.");
            }

            String fileName = UUID.randomUUID().toString() + fileExtension;
            Path targetLocation = this.fileStorageLocation.resolve(fileName).normalize();
            if (!targetLocation.startsWith(this.fileStorageLocation)) {
                throw new IllegalArgumentException("Invalid upload destination.");
            }
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/")
                    .path(fileName)
                    .toUriString();

            return ResponseEntity.ok(fileDownloadUri);
        } catch (IOException ex) {
            throw new RuntimeException("Could not store the uploaded image. Please try again!", ex);
        }
    }
}
