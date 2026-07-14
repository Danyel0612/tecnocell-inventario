package com.tecnocell.Inventario.security;

import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

/**
 * Lista negra de tokens JWT revocados.
 *
 * Cuando un usuario hace logout, su token se agrega aqui.
 * El JwtFilter rechaza cualquier token que aparezca en esta lista.
 *
 * Nota: Al reiniciar el servidor la lista se vacia (comportamiento
 * aceptable en este entorno — los tokens expirados de todas formas
 * dejan de ser validos despues de 24 h).
 */
@Component
public class TokenBlacklistService {

    // Set thread-safe para entornos con multiples peticiones concurrentes
    private final Set<String> revokedTokens =
            Collections.synchronizedSet(new HashSet<>());

    /** Revoca un token (se llama al hacer logout). */
    public void revocar(String token) {
        revokedTokens.add(token);
    }

    /** Retorna true si el token fue revocado (usuario hizo logout). */
    public boolean estaRevocado(String token) {
        return revokedTokens.contains(token);
    }
}
