package com.tecnocell.Inventario.repository;

import com.tecnocell.Inventario.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    List<Usuario> findByActivoTrue();
    Optional<Usuario> findByUsername(String username);
    Optional<Usuario> findByUsernameAndPassword(String username, String password);
}
