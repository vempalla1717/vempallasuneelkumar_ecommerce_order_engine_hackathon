package com.ecommerce.engine.controller;

import com.ecommerce.engine.entity.AuditLog;
import com.ecommerce.engine.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/logs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuditLogController {
    private final AuditLogService auditLogService;

    @GetMapping
    public ResponseEntity<List<AuditLog>> getAllLogs() {
        return ResponseEntity.ok(auditLogService.getAllLogs());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AuditLog>> getLogsByUser(@PathVariable String userId) {
        return ResponseEntity.ok(auditLogService.getLogsByUser(userId));
    }

    @GetMapping("/entity/{entityType}")
    public ResponseEntity<List<AuditLog>> getLogsByEntity(@PathVariable String entityType) {
        return ResponseEntity.ok(auditLogService.getLogsByEntityType(entityType));
    }
}
