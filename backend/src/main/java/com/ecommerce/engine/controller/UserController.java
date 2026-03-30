package com.ecommerce.engine.controller;

import com.ecommerce.engine.entity.User;
import com.ecommerce.engine.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {
    private final UserService userService;

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(@RequestBody User user) {
        User saved = userService.signup(user);
        return ResponseEntity.ok(Map.of(
                "message", "Account created successfully!",
                "userName", saved.getUserName(),
                "firstName", saved.getFirstName()
        ));
    }

    @PostMapping("/signin")
    public ResponseEntity<Map<String, Object>> signin(@RequestBody Map<String, String> body) {
        String userName = body.get("userName");
        String password = body.get("password");
        return ResponseEntity.ok(userService.signin(userName, password));
    }
}
