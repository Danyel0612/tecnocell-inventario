package com.tecnocell.Inventario.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@RestController
@RequestMapping("/api/consulta")
@RequiredArgsConstructor
public class ConsultaApiController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final String TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImRhbnllbDA2MTI5NUBnbWFpbC5jb20ifQ.DR8hg0H9dxJNxXWz--RAxlvvtOsBHseG8dSEk45WdCA";

    @GetMapping("/dni/{dni}")
    public ResponseEntity<?> consultarDNI(@PathVariable String dni) {
        try {
            String url = "https://dniruc.apisperu.com/api/v1/dni/" + dni + "?token=" + TOKEN;
            Map response = restTemplate.getForObject(url, Map.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "No se pudo consultar DNI"));
        }
    }

    @GetMapping("/ruc/{ruc}")
    public ResponseEntity<?> consultarRUC(@PathVariable String ruc) {
        try {
            String url = "https://dniruc.apisperu.com/api/v1/ruc/" + ruc + "?token=" + TOKEN;
            Map response = restTemplate.getForObject(url, Map.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "No se pudo consultar RUC"));
        }
    }
}
