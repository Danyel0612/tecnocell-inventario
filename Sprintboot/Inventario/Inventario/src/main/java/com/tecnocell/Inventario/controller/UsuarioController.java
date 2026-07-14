package com.tecnocell.Inventario.controller;

import com.tecnocell.Inventario.model.Usuario;
import com.tecnocell.Inventario.security.JwtUtil;
import com.tecnocell.Inventario.security.TokenBlacklistService;
import com.tecnocell.Inventario.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService service;
    private final JwtUtil jwtUtil;
    private final TokenBlacklistService blacklist;

    @GetMapping
    public List<Usuario> listar() {
        return service.listarActivos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> obtener(@PathVariable Long id) {
        return ResponseEntity.ok(service.obtenerPorId(id));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        return service.login(body.get("username"), body.get("password"))
                .map(user -> {
                    String token = jwtUtil.generateToken(user.getUsername(), user.getRol());
                    Map<String, Object> resp = new LinkedHashMap<>();
                    resp.put("token",    token);
                    resp.put("id",       user.getId());
                    resp.put("username", user.getUsername());
                    resp.put("nombre",   user.getNombre());
                    resp.put("rol",      user.getRol());
                    resp.put("email",    user.getEmail());
                    resp.put("dni",      user.getDni());
                    resp.put("tel",      user.getTel());
                    return ResponseEntity.<Object>ok(resp);
                })
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
    }

    /**
     * Logout real: agrega el token actual a la lista negra del servidor.
     * A partir de ese momento el token es rechazado aunque no haya expirado.
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            blacklist.revocar(header.substring(7));
        }
        return ResponseEntity.ok(Map.of("mensaje", "Sesion cerrada correctamente"));
    }

    @PostMapping
    public ResponseEntity<Usuario> crear(@Valid @RequestBody Usuario usuario) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(usuario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> actualizar(@PathVariable Long id, @Valid @RequestBody Usuario usuario) {
        return ResponseEntity.ok(service.actualizar(id, usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.ok(Map.of("mensaje", "Usuario eliminado correctamente"));
    }
}
