package com.ecommerce.engine.service;

import com.ecommerce.engine.entity.User;
import com.ecommerce.engine.exception.BusinessException;
import com.ecommerce.engine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public User signup(User user) {
        if (userRepository.existsByUserName(user.getUserName())) {
            throw new BusinessException("Username '" + user.getUserName() + "' already taken.");
        }
        // First user gets admin role, rest get user role
        if (userRepository.count() == 0) {
            user.setRole("admin");
        } else {
            user.setRole("user");
        }
        return userRepository.save(user);
    }

    public Map<String, Object> signin(String userName, String password) {
        User user = userRepository.findByUserName(userName)
                .orElseThrow(() -> new BusinessException("Invalid username or password."));

        if (!user.getPassword().equals(password)) {
            throw new BusinessException("Invalid username or password.");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("userId", user.getUserId().toString());
        result.put("userName", user.getUserName());
        result.put("firstName", user.getFirstName());
        result.put("lastName", user.getLastName());
        result.put("role", user.getRole());
        result.put("message", "Login successful");
        return result;
    }
}
