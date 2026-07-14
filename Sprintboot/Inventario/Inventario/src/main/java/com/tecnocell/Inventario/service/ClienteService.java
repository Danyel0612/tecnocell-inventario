package com.tecnocell.Inventario.service;

import com.tecnocell.Inventario.model.Cliente;
import com.tecnocell.Inventario.repository.ClienteRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository repo;

    public List<Cliente> listarActivos() {
        return repo.findByActivoTrue();
    }

    public List<Cliente> listarTodos() {
        return repo.findAll();
    }

    public Cliente obtenerPorId(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cliente no encontrado con id: " + id));
    }

    public Optional<Cliente> buscarPorDoc(String doc) {
        return repo.findByDoc(doc);
    }

    public Cliente crear(Cliente cliente) {
        if (repo.findByDoc(cliente.getDoc()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un cliente con el documento: " + cliente.getDoc());
        }
        if (cliente.getActivo() == null) cliente.setActivo(true);
        return repo.save(cliente);
    }

    public Cliente actualizar(Long id, Cliente datos) {
        Cliente existente = obtenerPorId(id);
        existente.setNombre(datos.getNombre());
        existente.setTel(datos.getTel());
        existente.setEmail(datos.getEmail());
        existente.setDir(datos.getDir());
        existente.setActivo(datos.getActivo());
        return repo.save(existente);
    }

    public void eliminar(Long id) {
        Cliente c = obtenerPorId(id);
        c.setActivo(false);
        repo.save(c);
    }

    public List<Cliente> buscarPorNombre(String nombre) {
        return repo.findByNombreContainingIgnoreCaseAndActivoTrue(nombre);
    }
}
