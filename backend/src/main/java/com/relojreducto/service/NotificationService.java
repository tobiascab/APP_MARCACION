package com.relojreducto.service;

import org.springframework.lang.NonNull;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.HashMap;

@Service
public class NotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public void sendAdminAlert(@NonNull String type, @NonNull String message, Object data) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", type);
        payload.put("message", message);
        payload.put("data", data);
        payload.put("timestamp", System.currentTimeMillis());

        messagingTemplate.convertAndSend("/topic/admin-alerts", payload);
    }

    public void notifyUser(Long userId, @NonNull String message) {
        if (userId != null) {
            messagingTemplate.convertAndSend("/topic/user-" + userId, (Object) message);
        }
    }
}
