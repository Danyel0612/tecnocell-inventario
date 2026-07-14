package com.tecnocell.Inventario.service;

import com.tecnocell.Inventario.model.Usuario;
import com.tecnocell.Inventario.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository repo;

    public List<Usuario> listarActivos() {
        return repo.findByActivoTrue();
    }

    public Usuario obtenerPorId(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado con id: " + id));
    }

    public Optional<Usuario> login(String username, String password) {
        return repo.findByUsernameAndPassword(username, password);
    }

    public Usuario crear(Usuario usuario) {
        if (repo.findByUsername(usuario.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un usuario con el username: " + usuario.getUsername());
        }
        if (usuario.getActivo() == null) usuario.setActivo(true);
        if (usuario.getRol() == null) usuario.setRol("Vendedor");
        return repo.save(usuario);
    }

    public Usuario actualizar(Long id, Usuario datos) {
        Usuario existente = obtenerPorId(id);
        existente.setNombre(datos.getNombre());
        existente.setRol(datos.getRol());
        existente.setDni(datos.getDni());
        existente.setEmail(datos.getEmail());
        existente.setTel(datos.getTel());
        existente.setActivo(datos.getActivo());
        // Solo actualizar password si se envia uno nuevo
        if (datos.getPassword() != null && !datos.getPassword().isBlank()) {
            existente.setPassword(datos.getPassword());
        }
        return repo.save(existente);
    }

    public void eliminar(Long id) {
        Usuario u = obtenerPorId(id);
        u.setActivo(false);
        repo.save(u);
    }
}
