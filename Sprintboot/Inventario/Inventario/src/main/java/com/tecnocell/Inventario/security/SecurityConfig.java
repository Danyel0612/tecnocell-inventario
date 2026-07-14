package com.tecnocell.Inventario.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuracion de seguridad con autorizacion por ROL.
 *
 * Roles del sistema: ADMINISTRADOR | ALMACENERO | VENDEDOR
 * Spring Security usa el prefijo ROLE_ internamente; hasAnyRole() lo agrega solo.
 *
 * Matriz de permisos:
 * ┌──────────────────────────────┬───────────────┬────────────┬─────────┐
 * │ Endpoint                     │ Administrador │ Almacenero │ Vendedor│
 * ├──────────────────────────────┼───────────────┼────────────┼─────────┤
 * │ GET  /api/productos          │      ✅       │     ✅     │    ✅   │
 * │ POST/PUT/DELETE /api/prod.   │      ✅       │     ✅     │    ❌   │
 * │ /api/clientes/**             │      ✅       │     ❌     │    ✅   │
 * │ /api/proveedores/**          │      ✅       │     ✅     │    ❌   │
 * │ GET  /api/movimientos/**     │      ✅       │     ✅     │    ✅   │
 * │ POST /api/movimientos/entrada│      ✅       │     ✅     │    ❌   │
 * │ POST /api/movimientos/salida │      ✅       │     ✅     │    ✅   │
 * │ /api/usuarios/**             │      ✅       │     ❌     │    ❌   │
 * └──────────────────────────────┴───────────────┴────────────┴─────────┘
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // ── RUTAS PUBLICAS (sin token) ─────────────────────────────────────
                .requestMatchers(HttpMethod.POST, "/api/usuarios/login").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/", "/index.html", "/app.js", "/style.css",
                                 "/favicon.ico", "/*.css", "/*.js",
                                 "/assets/**", "/img/**").permitAll()

                // ── LOGOUT (requiere token valido, cualquier rol) ──────────────────
                .requestMatchers(HttpMethod.POST, "/api/usuarios/logout").authenticated()

                // ── USUARIOS (solo Administrador) ──────────────────────────────────
                .requestMatchers("/api/usuarios/**")
                    .hasRole("ADMINISTRADOR")

                // ── PRODUCTOS — lectura: todos; escritura: Admin + Almacenero ──────
                .requestMatchers(HttpMethod.GET, "/api/productos/**")
                    .hasAnyRole("ADMINISTRADOR", "ALMACENERO", "VENDEDOR")
                .requestMatchers(HttpMethod.POST, "/api/productos/**")
                    .hasAnyRole("ADMINISTRADOR", "ALMACENERO")
                .requestMatchers(HttpMethod.PUT, "/api/productos/**")
                    .hasAnyRole("ADMINISTRADOR", "ALMACENERO")
                .requestMatchers(HttpMethod.DELETE, "/api/productos/**")
                    .hasAnyRole("ADMINISTRADOR", "ALMACENERO")

                // ── CLIENTES (Admin + Vendedor) ────────────────────────────────────
                .requestMatchers("/api/clientes/**")
                    .hasAnyRole("ADMINISTRADOR", "VENDEDOR")

                // ── PROVEEDORES (Admin + Almacenero) ──────────────────────────────
                .requestMatchers("/api/proveedores/**")
                    .hasAnyRole("ADMINISTRADOR", "ALMACENERO")

                // ── MOVIMIENTOS: lectura todos; entrada Admin+Almacenero ───────────
                .requestMatchers(HttpMethod.GET, "/api/movimientos/**")
                    .hasAnyRole("ADMINISTRADOR", "ALMACENERO", "VENDEDOR")
                .requestMatchers(HttpMethod.POST, "/api/movimientos/entrada")
                    .hasAnyRole("ADMINISTRADOR", "ALMACENERO")
                .requestMatchers(HttpMethod.POST, "/api/movimientos/salida")
                    .hasAnyRole("ADMINISTRADOR", "ALMACENERO", "VENDEDOR")

                // ── CUALQUIER OTRA RUTA autenticada ───────────────────────────────
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
